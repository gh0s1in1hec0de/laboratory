import { balancedTonClient, retrieveAllUnknownTransactions } from "./api";
import { ok as assert } from "node:assert";
import { Address } from "@ton/ton";
import { logger } from "../logger";
import { delay } from "../utils";
import * as db from "../db";
import {
    MAX_WL_ROUND_TON_LIMIT,
    parseGetConfigResponse,
    type RawAddressString,
    parseBalanceUpdate,
    parseRefundOrClaim,
    BalanceUpdateMode,
    type LamportTime,
    loadOpAndQueryId,
    TokensLaunchOps,
    parseMoneyFlows,
    UserVaultOps,
    type Coins,
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
            await delay(1 + Math.random()); // As we don't want all the api requests in the same moment
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
                if (op === TokensLaunchOps.CreatorBuyout) {
                    const moneyFlowsResponse = await balancedTonClient.execute(
                        c => c.runMethod(Address.parse(launchAddress), "get_config", []), true
                    );
                    const {
                        creatorFutJetBalance,
                        creatorFutJetPriceReversed
                    } = parseGetConfigResponse(moneyFlowsResponse.stack);
                    const investedValue = creatorFutJetBalance * MAX_WL_ROUND_TON_LIMIT / creatorFutJetPriceReversed;

                    const attachedValue: Coins = inMsg.info.value.coins ?? 0n;
                    const cornerCase = investedValue > attachedValue;
                    if (cornerCase) logger().error(`error in creator invested value calculations (${investedValue} > ${attachedValue}) for token launch ${launch.address}`);
                    await db.updateLaunchBalance(
                        launch.address,
                        { creatorTonsCollected: cornerCase ? attachedValue * 98n / 100n : investedValue }
                    );
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
                    logger().error(`action[${action.actor}; ${action.timestamp}] record error: ${e}`);
                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            const moneyFlowsResponse = await balancedTonClient.execute(c => c.runMethod(Address.parse(launchAddress), "get_money_flows", []), true);
            const { totalTonsCollected, wlRoundTonInvestedTotal } = parseMoneyFlows(moneyFlowsResponse.stack);
            await db.updateLaunchBalance(launch.address, {
                totalTonsCollected,
                wlTonsCollected: wlRoundTonInvestedTotal
            });
            await delay(balancedTonClient.delayValue());
        } catch (e) {
            logger().error(`failed to handle launch ${launchAddress} update with general error: ${e}`);
            await delay(balancedTonClient.delayValue() / 2);
        }
    }
}