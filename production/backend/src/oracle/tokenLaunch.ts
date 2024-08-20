import {
    parseBalanceUpdate,
    parseRefundOrClaim,
    loadOpAndQueryId,
    TokensLaunchOps,
    UserVaultOps
} from "./messageParsers";
import { BalanceUpdateMode, balanceUpdateModeToUserActionType } from "./types.ts";
import { delay, type LamportTime, type RawAddressString } from "../utils";
import { retrieveAllUnknownTransactions } from "./api";
import * as db from "../db";

export async function handleTokenLaunchUpdates(launchAddress: RawAddressString) {
    console.debug(`new token launch updates handler for ${launchAddress} is up`);
    const tokenLaunch = await db.getTokenLaunch(launchAddress);
    // TODO Proper error handling
    if (!tokenLaunch) return;
    let currentHeight = await db.getLaunchHeight(launchAddress) ?? 0n;

    while (true) {
        try {
            // This is a constraint to stop monitoring contract calls and update data based on that
            // I don't know certainly, what is end time - end of launch or end of claims opportunity(todo)
            if (Date.now() < tokenLaunch.timings.endTime.getTime()) break;

            const newTxs = await retrieveAllUnknownTransactions(launchAddress, currentHeight);
            for (const tx of newTxs) {
                const userActions: db.UserAction[] = [];
                const inMsg = tx.inMessage;
                if (!inMsg) continue;
                if (inMsg.info.type !== "internal") continue;

                const txCreatedAt = new Date(tx.now * 1000);
                const lt: LamportTime = tx.lt;
                const outMsgs = tx.outMessages;
                const inMsgSender = inMsg.info.src;
                const inMsgBody = inMsg.body.beginParse();
                // We don't care about simple transfers
                if (inMsgBody.remainingBits < (32 + 64)) continue;

                const { msgBodyData, op, queryId } = await loadOpAndQueryId(inMsgBody);
                if ([TokensLaunchOps.jettonClaimConfirmation, TokensLaunchOps.refundConfirmation].includes(op)) {
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
                        actionType: mode ? balanceUpdateModeToUserActionType[mode] : db.UserActionType.Claim,
                        whitelistTons,
                        publicTons,
                        jettons: futureJettons,
                        lt,
                        timestamp: txCreatedAt,
                        queryId
                    } as db.UserAction);
                }

                // Here we'll handle only DEPOSITING operations
                for (const [_n, msg] of outMsgs) {
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
                        actionType: balanceUpdateModeToUserActionType[mode],
                        whitelistTons,
                        publicTons,
                        jettons: futureJettons,
                        lt,
                        timestamp: txCreatedAt,
                        queryId
                    } as db.UserAction);
                }
                // TODO Completely change the way of recording new actions
                await db.storeUserActions(userActions);
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            await delay(2000); // TODO Determine synthetic delay
        } catch (e) {
            console.error(`failed to handle launch ${launchAddress} update with error: ${e}`);
        }
    }
}