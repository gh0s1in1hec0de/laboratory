import {
    type TokenLaunchStorageV1, type TokenLaunchStorageV2, type RawAddressString, GlobalVersions, TokensLaunchOps,
    retrieveAllUnknownTransactions, parseTokenLaunchV1Storage, parseTokenLaunchV2Storage,
    parseTokenLaunchTimings, parseJettonMetadata, loadOpAndQueryId, delay,
} from "starton-periphery";
import { balancedTonClient } from "./client";
import type { Address } from "@ton/ton";
import { logger } from "../logger";
import * as db from "../db";

export async function handleCoreUpdates(coreAddress: RawAddressString, coreVersion: GlobalVersions) {
    let currentHeight = await db.getHeight(coreAddress) ?? 0n;
    while (true) {
        try {
            const newTxs = await retrieveAllUnknownTransactions(coreAddress, currentHeight, logger, balancedTonClient);
            if (!newTxs) {
                const delayTime = 30;
                logger().info(`no updates for code ${coreAddress}, sleeping for ${delayTime} seconds...`);
                await delay(delayTime);
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
                    logger().info(`found new launch with address: ${address} created at ${new Date(msg.info.createdAt * 1000)}`);

                    const newLaunchStateInit = msg.init!.data!; // As we can guarantee our contract behaviour
                    const parsedStateInit: TokenLaunchStorageV1 | TokenLaunchStorageV2 =
                        coreVersion === GlobalVersions.V1 ?
                            parseTokenLaunchV1Storage(newLaunchStateInit) :
                            parseTokenLaunchV2Storage(newLaunchStateInit);

                    // We may guarantee that futJetPlatformAmount can't be 10000x times bigger than futJetTotalSupply
                    const percentage =
                        (parsedStateInit.saleConfig.futJetPlatformAmount * BigInt(10000) * BigInt(100))
                        / parsedStateInit.saleConfig.futJetTotalSupply;
                    const platformShare = Number(percentage) / 10000;
                    const metadata = await parseJettonMetadata(parsedStateInit.tools.metadata, 1);

                    await db.storeTokenLaunch({
                        address,
                        identifier: `${metadata.symbol} ${metadata.name} ${metadata.description}`.trim(),
                        creator: parsedStateInit.creatorAddress.toRawString(),
                        version: coreVersion,
                        metadata: { ...metadata, decimals: metadata.decimals ?? "6" },
                        platformShare,
                        minTonTreshold: parsedStateInit.saleConfig.minTonForSaleSuccess,
                        timings: parseTokenLaunchTimings(parsedStateInit),
                        totalSupply: parsedStateInit.saleConfig.futJetTotalSupply,
                        createdAt: msg.info.createdAt
                    });
                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            await db.setHeightForAddress(coreAddress, currentHeight, true);
            await delay(60);
        } catch (e) {
            logger().error(`failed to load new launches for core(${coreAddress}) with error: ${e}`);
            console.error(e);
            await delay(30);
        }
    }
}