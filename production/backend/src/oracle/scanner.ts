import type {Address} from "@ton/ton";
import * as db from "../db";

// `stopAt` is lamport time of last known
export async function retrieveAllUnknownTransactions(stopAt: bigint) {

}

export async function handleCoreUpdates() {

}

export async function handleTokenLaunchUpdates(launchAddress: Address) {
    const tokenLaunch = await db.getTokenLaunch(launchAddress.toRawString());

    let someConstraint = true;
    let currentHeight = tokenLaunch.height;

    while (true) {
        // This is a constraint to stop monitoring contract calls and update data based on that
        // I don't know certainly, what is end time - end of launch or end of claims opportunity(todo)
        if (Date.now() < tokenLaunch.endTime.getTime()) break;




    }
}