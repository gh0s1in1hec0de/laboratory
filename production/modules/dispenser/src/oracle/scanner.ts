import { type Coins, delay, retrieveAllUnknownTransactions } from "starton-periphery";
import { handleMaybeClaimRequest } from "./claimHandler";
import { balancedTonClient } from "../client";
import { Address, fromNano } from "@ton/ton";
import { getConfig } from "../config";
import { logger } from "../logger";
import * as db from "../db";

export type ClaimRequest = {
    user: Address,
    requestType: "t" | string,
    attachedValue: Coins,
}

export async function scanForRequests() {
    const walletAddress = Address.parse(getConfig().ton.wallet.address).toRawString();
    while (true) {
        try {
            let currentHeight = await db.getHeight(walletAddress) ?? 0n;
            const newTxs = await retrieveAllUnknownTransactions(walletAddress, currentHeight, logger, balancedTonClient);
            if (!newTxs) {
                logger().info("updates for dispenser not found");
                await delay(15);
                continue;
            }

            const requests: ClaimRequest[] = [];
            for (const tx of newTxs) {
                const inMsg = tx.inMessage;
                if (!inMsg) continue;
                if (inMsg.info.type !== "internal") continue;

                const sender = inMsg.info.src;
                const attachedValue: Coins = inMsg.info.value.coins;
                const inMsgBody = inMsg.body.beginParse();
                // We don't care about simple transfers

                if (inMsgBody.remainingBits < 32) continue;

                const op = inMsgBody.loadUint(32);
                if (op !== 0) continue;
                try {
                    const comment = inMsgBody.loadStringTail();
                    logger().info(`New transfer from ${sender} with value ${fromNano(attachedValue)} TON and comment: "${comment}"`);
                    requests.push({ user: sender, requestType: comment, attachedValue });
                } catch (e) {
                    logger().warn(`failed to load comment for transfer [${sender.toRawString()}; ${fromNano(attachedValue)} TONs; ${tx.now}]`);
                }
            }
            // Setting height before processing to not process requests twice
            currentHeight = newTxs[newTxs.length - 1].lt;
            await db.setHeightForAddress(walletAddress, currentHeight, true);

            const startTime = Date.now();
            await Promise.allSettled(
                requests.map((request, index) =>
                    delay(index / 2).then(() => handleMaybeClaimRequest(request))
                )
            );
            const elapsedTime = (Date.now() - startTime) / 1000; // Convert to seconds
            logger().debug(`processed ${requests.length} requests in ${elapsedTime} seconds`);

            await delay(Math.max(5 - elapsedTime, 0));
        } catch (e) {
            logger().error("failed to load new requests with error: ", e);
            await delay(15);
        }
    }
}