import { type Coins, delay, retrieveAllUnknownTransactions } from "starton-periphery";
import { balancedTonClient } from "../client.ts";
import { Address, fromNano } from "@ton/ton";
import { getConfig } from "../config.ts";
import { logger } from "../logger.ts";
import * as db from "../db";
import { handleMaybeClaimRequest } from "./claimHandler.ts";

export type ClaimRequest = {
    user: Address,
    requestType: "t" | string,
    attachedValue: Coins,
}

export async function scanner() {
    const walletAddress = Address.parse(getConfig().ton.wallet.address).toRawString();
    while (true) {
        try {
            let currentHeight = await db.getHeight(walletAddress) ?? 0n;
            const newTxs = await retrieveAllUnknownTransactions(walletAddress, currentHeight, logger, balancedTonClient);
            if (!newTxs) {
                logger().info("updates for chief not found");
                await delay(15);
                return;
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

                const comment = inMsgBody.loadStringTail();
                logger().info(`New transfer from ${sender} with value ${fromNano(attachedValue)} TON and comment: "${comment}"`);
                requests.push({ user: sender, requestType: comment, attachedValue });
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            await db.setHeightForAddress(walletAddress, currentHeight, true);

            // TODO await
            for (const request of requests) {
                handleMaybeClaimRequest(request);
                delay(1);
            }
            await delay(35);
        } catch (e) {
            logger().error(`failed to load chief(${walletAddress}) updates with error: `, e);
            await delay(17.5);
        }
    }
}