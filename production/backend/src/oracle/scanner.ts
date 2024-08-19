import { BalanceUpdateMode, balanceUpdateModeToUserAction } from "./types.ts";
import { getTransactionsForAccount } from "./api";
import type { Address, Transaction } from "@ton/ton";
import type { LamportTime } from "../utils";
import * as db from "../db";
import {
    parseBalanceUpdate,
    parseRefundOrClaim,
    loadOpAndQueryId,
    TokensLaunchOps,
    UserVaultOps
} from "./messageParsers";

// `stopAt` is lamport time of last known tx; returns an array of new transactions oldest -> the newest
//
// Warning! Function may throw and error - this case should be properly handled
async function retrieveAllUnknownTransactions(
    address: Address,
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

export async function handleCoreUpdates() {

}

export async function handleTokenLaunchUpdates(launchAddress: Address) {
    const tokenLaunch = await db.getTokenLaunch(launchAddress.toRawString());
    // TODO Proper error handling
    if (!tokenLaunch) return;
    let currentHeight  = await db.getHeight(launchAddress.toRawString()) ?? 0n;

    let iterationNumber = 0;
    while (true) {
        try {
            iterationNumber += 1;
            // This is a constraint to stop monitoring contract calls and update data based on that
            // I don't know certainly, what is end time - end of launch or end of claims opportunity(todo)
            if (Date.now() < tokenLaunch.endTime.getTime()) break;

            const newTxs = await retrieveAllUnknownTransactions(launchAddress, currentHeight);
            currentHeight = newTxs[newTxs.length - 1].lt;
            // Don't give a fuck about order of recording data in db it will be recorded with sql transaction
            // TODO record time
            if (iterationNumber % 4 === 0) await db.setHeight(launchAddress.toRawString(), currentHeight);

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
                if ([TokensLaunchOps.jettonClaimConfirmation, TokensLaunchOps.refundConfirmation].includes(op)) {
                    const { whitelistTons, publicTons, futureJettons, recipient } = parseRefundOrClaim(msgBodyData);
                    // await storeUserAction();
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
                    await db.storeUserAction(
                        balanceUpdateModeToUserAction(mode),
                        inMsgSender.toRawString(),
                        launchAddress.toRawString(),
                        whitelistTons,
                        publicTons,
                        futureJettons,
                        txCreatedAt,
                        queryId
                    );
                    // TODO Record of a new action; we'll record refunds and claims from confirmations as it is safer
                }
            }
        } catch (e) {
            console.error(`failed to handle launch ${launchAddress} update with error: ${e}`);
        }
    }
}