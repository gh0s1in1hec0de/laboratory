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
    let currentHeight = await db.getHeight(coreAddress) ?? 0n;
    while (true) {
        try {
            const newTxs = await retrieveAllUnknownTransactions(coreAddress, currentHeight);
            if (!newTxs.length) {
                await delay(30);
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
                    if (op !== TokensLaunchOps.Init || msg.info.type !== "internal") continue;
                    const newLaunchAddress = msg.info.dest;
                    if (!newLaunchAddress) continue;

                    const address: RawAddressString = (newLaunchAddress as Address).toRawString(); // Is it safe?
                    logger().debug(`found new launch with address: ${address}`);

                    const newLaunchStateInit = msg.init!.data!; // As we can guarantee our contract behaviour
                    const parsedStateInit = coreVersion === GlobalVersions.V1 ?
                        parseTokenLaunchV1Storage(newLaunchStateInit) :
                        parseTokenLaunchV2AStorage(newLaunchStateInit);
                    /* TODO
                        Fetch metadata by url inside
                        Build name from ticker + token */
                    await db.storeTokenLaunch({
                        identifier: `dummy${Date.now()}`,
                        address,
                        creator: parsedStateInit.creatorAddress.toRawString(),
                        version: coreVersion,
                        metadata: parseMetadataCell(parsedStateInit.tools.metadata),
                        // An error may occur here
                        timings: parseTokenLaunchTimings(parsedStateInit),
                        createdAt: msg.info.createdAt
                    });
                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            await db.setHeightForAddress(coreAddress, currentHeight, true);
            await delay(60);
        } catch (e) {
            logger().error(`failed to load new launches for core(${coreAddress}) update with error: ${e}`);
            await delay(30);
        }
    }
}