import {
    type RawAddressString, parseTokenLaunchStorage, TokensLaunchOps,
    parseTokenLaunchTimings, parseMetadataCell, loadOpAndQueryId,
} from "starton-periphery";
import { handleTokenLaunchUpdates } from "./tokenLaunch.ts";
import { retrieveAllUnknownTransactions } from "./api.ts";
import type { Address } from "@ton/ton";
import { useLogger } from "../logger";
import { delay } from "../utils.ts";
import * as db from "../db";

export async function handleCoreUpdates(coreAddress: RawAddressString) {
    const logger = useLogger();
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
                for (const [_n, msg] of tx.outMessages) {
                    const outMsgBody = msg.body.beginParse();
                    if (outMsgBody.remainingBits < (32 + 64)) continue;
                    const { msgBodyData, op, queryId } = await loadOpAndQueryId(outMsgBody);
                    if (op !== TokensLaunchOps.init) continue;
                    const newLaunchAddress = msg.info.dest;
                    if (!newLaunchAddress) continue;
                    const address: RawAddressString = (newLaunchAddress as Address).toRawString(); // Is it safe?

                    const newLaunchStateinit = msg.init!.data!; // As we can guarantee our contract behaviour
                    const parsedStateinit = parseTokenLaunchStorage(newLaunchStateinit);
                    await db.storeTokenLaunch({
                        address,
                        creator: parsedStateinit.creatorAddress.toRawString(),
                        metadata: parseMetadataCell(parsedStateinit.tools.metadata),
                        // An error may occur here
                        timings: parseTokenLaunchTimings(parsedStateinit)
                    });
                    handleTokenLaunchUpdates(address);
                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            iteration += 1;
            if (iteration % 5 === 0) await db.setCoreHeight(coreAddress, currentHeight, true);
            await delay(5000); // TODO Determine synthetic delay
        } catch (e) {
            logger.error(`failed to load new launches for core(${coreAddress}) update with error: ${e}`);
        }
    }
}