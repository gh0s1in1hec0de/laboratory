import { retrieveAllUnknownTransactions } from "./api";
import type { Address } from "@ton/ton";
import { logger } from "../logger";
import { delay } from "../utils";
import * as db from "../db";
import {
    parseTokenLaunchV2AStorage,
    parseTokenLaunchV1Storage,
    parseTokenLaunchTimings,
    type RawAddressString,
    parseMetadataCell,
    loadOpAndQueryId,
    TokensLaunchOps,
    GlobalVersions,
} from "starton-periphery";

export async function handleCoreUpdates(coreAddress: RawAddressString, coreVersion: GlobalVersions) {
    let currentHeight = await db.getCoreHeight(coreAddress) ?? 0n;
    let iteration = 0;
    while (true) {
        try {
            const newTxs = await retrieveAllUnknownTransactions(coreAddress, currentHeight);
            if (!newTxs.length) {
                await delay(5000);
                continue;
            }
            for (const tx of newTxs) {
                const inMsg = tx.inMessage;
                if (!inMsg) continue;
                if (inMsg.info.type !== "internal") continue;

                // In this section we are going to listen ONLY for new launches deployment
                for (const [, msg] of tx.outMessages) {
                    const outMsgBody = msg.body.beginParse();
                    if (outMsgBody.remainingBits < (32 + 64)) continue;
                    const { op } = await loadOpAndQueryId(outMsgBody);
                    if (op !== TokensLaunchOps.Init) continue;
                    const newLaunchAddress = msg.info.dest;
                    if (!newLaunchAddress) continue;
                    const address: RawAddressString = (newLaunchAddress as Address).toRawString(); // Is it safe?

                    const newLaunchStateInit = msg.init!.data!; // As we can guarantee our contract behaviour
                    const parsedStateInit = coreVersion === GlobalVersions.V1 ?
                        parseTokenLaunchV1Storage(newLaunchStateInit) :
                        parseTokenLaunchV2AStorage(newLaunchStateInit);
                    /* TODO
                        Fetch metadata by url inside
                        Build name from ticker + token */
                    await db.storeTokenLaunch({
                        address,
                        creator: parsedStateInit.creatorAddress.toRawString(),
                        metadata: parseMetadataCell(parsedStateInit.tools.metadata),
                        name: "dummy",
                        // An error may occur here
                        timings: parseTokenLaunchTimings(parsedStateInit)
                    });
                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            iteration += 1;
            if (iteration % 5 === 0) await db.setCoreHeight(coreAddress, currentHeight, true);
            await delay(30000); // TODO Determine synthetic delay
        } catch (e) {
            logger().error(`failed to load new launches for core(${coreAddress}) update with error: ${e}`);
        }
    }
}