import { BalanceUpdateMode, balanceUpdateModeToUserActionType } from "./types.ts";
import { delay, type LamportTime, type RawAddressString } from "../utils";
import { getTransactionsForAccount } from "./api";
import type { Transaction } from "@ton/ton";
import * as db from "../db";
import {
    loadOpAndQueryId,
    parseBalanceUpdate,
    parseRefundOrClaim,
    TokensLaunchOps,
    UserVaultOps
} from "./messageParsers";
import { setCoreHeight } from "../db";

// `stopAt` is lamport time of last known tx; returns an array of new transactions oldest -> the newest
//
// Warning! Function may throw and error - this case should be properly handled
async function retrieveAllUnknownTransactions(
    address: RawAddressString,
    stopAt: LamportTime,
    parsingOptions?: {
        archival: boolean;
        limit: number;
    }
): Promise<Transaction[]> {
    const newTransactions: Transaction[] = [];
    let startFrom: { lt: LamportTime; hash: string } | undefined = undefined;
    while (true) {
        const transactions = await getTransactionsForAccount(address, stopAt, startFrom, parsingOptions?.archival, parsingOptions?.limit);

        if (transactions.length === 0) break;
        newTransactions.push(...transactions);

        // Update our new starting point to last parsed tx
        const lastParsedTx = transactions[transactions.length - 1];
        startFrom = { lt: lastParsedTx.lt, hash: lastParsedTx.hash().toString("base64") };
    }
    // No updates happened case
    if (newTransactions.length == 0) return [];
    // From oldest to newest
    newTransactions.sort((a, b) => {
        if (a.lt < b.lt) return -1;
        if (a.lt > b.lt) return 1;
        return 0;
    });
    return newTransactions;
}

export async function handleCoreUpdates(coreAddress: RawAddressString) {
    let currentHeight = await db.getCoreHeight(coreAddress) ?? 0n;
    let iteration = 0;
    while (true) {
        try {
            const newTxs = await retrieveAllUnknownTransactions(coreAddress, currentHeight);
            for (const tx of newTxs) {
                const inMsg = tx.inMessage;
                if (!inMsg) continue;
                if (inMsg.info.type !== "internal") continue;

                const txCreatedAt = new Date(tx.now * 1000);
                const outMsgs = tx.outMessages;
                const inMsgSender = inMsg.info.src;
                const inMsgBody = inMsg.body.beginParse();
                // We don't care about simple transfers
                if (inMsgBody.remainingBits < 32) continue;

                const { msgBodyData, op, queryId } = await loadOpAndQueryId(inMsgBody);


                // Here we'll handle only DEPOSITING operations
                for (const [_n, msg] of outMsgs) {
                    const outMsgBody = msg?.body.beginParse();
                    const { msgBodyData, op, queryId } = await loadOpAndQueryId(outMsgBody);

                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            iteration += 1;
            if (iteration % 5 === 0) await setCoreHeight(coreAddress, currentHeight, true);
            // TODO Determine synthetic delay
            await delay(5000);
        } catch (e) {
            console.error(`failed to load new launches for core(${coreAddress}) update with error: ${e}`);
        }
    }
}

export async function handleTokenLaunchUpdates(launchAddress: RawAddressString) {
    const tokenLaunch = await db.getTokenLaunch(launchAddress);
    // TODO Proper error handling
    if (!tokenLaunch) return;
    let currentHeight = await db.getLaunchHeight(launchAddress) ?? 0n;

    while (true) {
        try {
            // This is a constraint to stop monitoring contract calls and update data based on that
            // I don't know certainly, what is end time - end of launch or end of claims opportunity(todo)
            if (Date.now() < tokenLaunch.endTime.getTime()) break;

            const newTxs = await retrieveAllUnknownTransactions(launchAddress, currentHeight);
            for (const tx of newTxs) {
                const userActionsToRecord: db.UserAction[] = [];
                const inMsg = tx.inMessage;
                if (!inMsg) continue;
                if (inMsg.info.type !== "internal") continue;

                const txCreatedAt = new Date(tx.now * 1000);
                const outMsgs = tx.outMessages;
                const inMsgSender = inMsg.info.src;
                const inMsgBody = inMsg.body.beginParse();
                // We don't care about simple transfers
                if (inMsgBody.remainingBits < 32) continue;

                const { msgBodyData, op, queryId } = await loadOpAndQueryId(inMsgBody);
                if ([TokensLaunchOps.jettonClaimConfirmation, TokensLaunchOps.refundConfirmation].includes(op)) {
                    const {
                        whitelistTons,
                        publicTons,
                        futureJettons,
                        recipient,
                        mode
                    } = parseRefundOrClaim(msgBodyData);
                    userActionsToRecord.push({
                        actor: recipient,
                        tokenLaunch: launchAddress,
                        actionType: mode ? balanceUpdateModeToUserActionType[mode] : db.UserActionType.Claim,
                        whitelistTons,
                        publicTons,
                        jettons: futureJettons,
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
                    userActionsToRecord.push({
                        actor: inMsgSender.toRawString(),
                        tokenLaunch: launchAddress,
                        actionType: balanceUpdateModeToUserActionType[mode],
                        whitelistTons,
                        publicTons,
                        jettons: futureJettons,
                        timestamp: txCreatedAt,
                        queryId
                    } as db.UserAction);
                }
                await db.storeUserActions(userActionsToRecord);
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            await delay(2000); // TODO Determine synthetic delay
        } catch (e) {
            console.error(`failed to handle launch ${launchAddress} update with error: ${e}`);
        }
    }
}