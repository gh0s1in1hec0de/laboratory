import { balancedTonClient, retrieveAllUnknownTransactions } from "./api";
import { ok as assert } from "node:assert";
import { logger } from "../logger";
import { delay } from "../utils";
import * as db from "../db";
import {
    type RawAddressString,
    parseBalanceUpdate,
    parseRefundOrClaim,
    BalanceUpdateMode,
    type LamportTime,
    loadOpAndQueryId,
    TokensLaunchOps,
    UserVaultOps,
} from "starton-periphery";

export async function spawnNewLaunchesScanners(scanFrom?: Date) {
    let timeUpdate = scanFrom;
    while (true) {
        const newLaunches = await db.getActiveTokenLaunches(timeUpdate);
        if (!newLaunches) {
            await delay(30);
            continue;
        }
        for (const launch of newLaunches) {
            balancedTonClient.incrementActiveLaunchesAmount();
            handleTokenLaunchUpdates(launch);
        }
        timeUpdate = newLaunches.reduce((latest, launch) => {
            return launch.createdAt > latest ? launch.createdAt : latest;
        }, newLaunches[0].createdAt);
        await delay(15);
    }
}

async function handleTokenLaunchUpdates(tokenLaunch?: db.StoredTokenLaunch, launchAddress?: RawAddressString,) {
    assert(launchAddress && tokenLaunch, "unreachable");
    logger().debug(`new token launch updates handler for ${launchAddress} is up`);
    const launch = tokenLaunch ?? await db.getTokenLaunch(launchAddress);
    if (!launch) {
        logger().error(`launch ${launchAddress} not found in database`);
        return;
    }
    let currentHeight = await db.getLaunchHeight(launchAddress) ?? 0n;

    while (true) {
        try {
            // This is a constraint to stop monitoring contract calls and update data based on that
            // I don't know certainly, what is end time - end of launch or end of claims opportunity(todo)
            if (Date.now() < launch.timings.endTime.getTime()) {
                balancedTonClient.decrementActiveLaunchesAmount();
                break;
            }

            const newTxs = await retrieveAllUnknownTransactions(launchAddress, currentHeight);
            const newActionsChunk: db.UserAction[] = [];
            for (const tx of newTxs) {
                const userActions: db.UserAction[] = [];
                const inMsg = tx.inMessage;
                if (!inMsg) continue;
                if (inMsg.info.type !== "internal") continue;

                const txCreatedAt = new Date(tx.now * 1000);
                const lt: LamportTime = tx.lt;
                const inMsgSender = inMsg.info.src;
                const inMsgBody = inMsg.body.beginParse();
                // We don't care about simple transfers
                if (inMsgBody.remainingBits < (32 + 64)) continue;

                const { msgBodyData, op, queryId } = await loadOpAndQueryId(inMsgBody);
                if ([TokensLaunchOps.JettonClaimConfirmation, TokensLaunchOps.RefundConfirmation].includes(op)) {
                    const {
                        whitelistTons,
                        publicTons,
                        futureJettons,
                        recipient,
                        mode
                    } = parseRefundOrClaim(msgBodyData);
                    userActions.push({
                        actor: recipient,
                        tokenLaunch: launchAddress,
                        actionType: mode ? db.balanceUpdateModeToUserActionType[mode] : db.UserActionType.Claim,
                        whitelistTons,
                        publicTons,
                        jettons: futureJettons,
                        lt,
                        timestamp: txCreatedAt,
                        queryId
                    } as db.UserAction);
                }

                // Here we'll handle only DEPOSITING operations
                for (const [, msg] of tx.outMessages) {
                    const outMsgBody = msg?.body.beginParse();
                    const { msgBodyData, op, queryId } = await loadOpAndQueryId(outMsgBody);
                    // Then we'll look for following operation: balanceUpdate
                    if (op !== UserVaultOps.balanceUpdate) continue;
                    const { mode, tons, futureJettons } = parseBalanceUpdate(msgBodyData);
                    if (![BalanceUpdateMode.PublicDeposit, BalanceUpdateMode.WhitelistDeposit].includes(mode)) continue;
                    const [whitelistTons, publicTons] =
                        mode === BalanceUpdateMode.WhitelistDeposit ? [tons, 0n] : [0n, tons];
                    userActions.push({
                        actor: inMsgSender.toRawString(),
                        tokenLaunch: launchAddress,
                        actionType: db.balanceUpdateModeToUserActionType[mode],
                        whitelistTons,
                        publicTons,
                        jettons: futureJettons,
                        lt,
                        timestamp: txCreatedAt,
                        queryId
                    } as db.UserAction);
                }
                newActionsChunk.push(...userActions);
            }
            // We are not using sql transaction here intentionally
            for (const action of newActionsChunk) {
                // Catching every error separately to prevent record stoppage and transaction congestion
                // Theoretically, it should never trigger
                try {
                    await db.storeUserAction(action);
                } catch (e) {
                    logger().error(`action[${action.actor}, ${action.timestamp}] record error: ${e}`);
                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            await delay(balancedTonClient.delayValue());
        } catch (e) {
            logger().error(`failed to handle launch ${launchAddress} update with general error: ${e}`);
        }
    }
}