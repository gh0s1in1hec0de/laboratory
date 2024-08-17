import type {Address, Transaction} from "@ton/ton";
import {getTransactionsForAccount} from "./api.ts";
import type {LamportTime} from "../utils.ts";
import * as db from "../db";

// `stopAt` is lamport time of last known tx; returns an array of new transactions oldest -> the newest
//
// Warning! Function may throw and error - this case should be properly handled
async function retrieveAllUnknownTransactions(
    address: Address,
    stopAt: LamportTime,
    parsingOptions?: {
        archival: boolean,
        limit: number
    }
): Promise<Transaction[]> {
    const newTransactions: Transaction[] = [];
    let startFrom: { lt: LamportTime, hash: string } | undefined = undefined;
    while (true) {
        const transactions = await getTransactionsForAccount(address, stopAt, startFrom, parsingOptions?.archival, parsingOptions?.limit);

        if (transactions.length === 0) break;
        newTransactions.push(...transactions);

        // Update our new starting point to last parsed tx
        const lastParsedTx = transactions[transactions.length - 1];
        startFrom = {lt: lastParsedTx.lt, hash: lastParsedTx.hash().toString("base64")}
    }
    // No updates happened case
    if (newTransactions.length === 0) return [];
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

    let iterationNumber = 0;
    let someConstraint = true;
    let currentHeight: LamportTime = tokenLaunch.height;

    while (true) {
        try {
            iterationNumber += 1;
            // This is a constraint to stop monitoring contract calls and update data based on that
            // I don't know certainly, what is end time - end of launch or end of claims opportunity(todo)
            if (Date.now() < tokenLaunch.endTime.getTime()) break;
            const newTxs = await retrieveAllUnknownTransactions(launchAddress, currentHeight);
            currentHeight = newTxs[newTxs.length - 1].lt;
            if (iterationNumber % 4 === 0) await db.setTokenLaunchHeight(launchAddress.toRawString(), currentHeight);

            for (const tx of newTxs) {
                /*
                Which exactly incoming messages are interesting for us?
                 - wl confirmation
                 - refund/jetton claim confirmation
                 */
                const inMsg = tx.inMessage;
                const outMsg = tx.outMessages;

            }
        } catch (e) {
            console.error(`failed to handle launch ${launchAddress} update with error: ${e}`);
        }
    }
}