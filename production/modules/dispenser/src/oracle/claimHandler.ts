import { internal as internal_relaxed } from "@ton/core/dist/types/_helpers";
import { fromNano, type OutActionSendMsg, SendMode } from "@ton/ton";
import { Address, beginCell } from "@ton/core";
import type { ClaimRequest } from "./scanner";
import { balancedTonClient } from "../client";
import { walletData } from "./highload";
import { getConfig } from "../config";
import { logger } from "../logger";
import * as db from "../db";
import {
    SUBWALLET_ID, DEFAULT_TIMEOUT,
    OP_LENGTH, QUERY_ID_LENGTH,
    type RawAddressString,
    type RewardJetton,
    JettonOps,
    delay,
} from "starton-periphery";

export async function handleMaybeClaimRequest(request: ClaimRequest) {
    const { user, requestType, attachedValue } = request;

    const actions: OutActionSendMsg[] = [];
    try {
        if (requestType === "t") {
            const rewardBalances = await db.getRewardJettonBalances(user.toRawString());
            if (!rewardBalances) {
                logger().warn(`reward balances gone at some reason for user ${user}`);
                return refund(request);
            }
            const minValuePerTransfer = BigInt(getConfig().ton.fees.jetton_transfer_fee) + BigInt(getConfig().ton.fees.fee_per_call);
            if (attachedValue < BigInt(rewardBalances.length) * minValuePerTransfer) {
                logger().warn(`user ${user} sent not enough value to claim all the balances`);
                return refund(request);
            }
            const rewardJettons = await db.getRewardJettons(rewardBalances.map(p => p.rewardJetton));
            if (!rewardJettons || rewardJettons.length < rewardBalances.length) {
                logger().error(`unreachable: corrupted jetton data for user ${user} total`);
                return refund(request);
            }
            const rewardJettonMap: Record<RawAddressString, Omit<RewardJetton, "masterAddress">> = rewardJettons.reduce(
                (acc, { masterAddress, ...rest }) => ({
                    ...acc,
                    [masterAddress]: rest
                }), {}
            );
            const freeValue = attachedValue - (BigInt(getConfig().ton.fees.fee_per_call) * BigInt(rewardBalances.length));
            const valuePerTransfer = freeValue / BigInt(rewardBalances.length);
            const queryId = Math.floor(Date.now() / 1000);
            for (const { rewardJetton, balance } of rewardBalances) {
                actions.push({
                    type: "sendMsg",
                    mode: SendMode.NONE,
                    outMsg: internal_relaxed({
                        to: Address.parse(rewardJettonMap[rewardJetton].ourWalletAddress),
                        value: valuePerTransfer,
                        body: beginCell()
                            .storeUint(JettonOps.Transfer, OP_LENGTH)
                            .storeUint(queryId, QUERY_ID_LENGTH)
                            .storeCoins(balance)
                            .storeAddress(user)
                            .storeAddress(user)
                            .storeMaybeRef()
                            // At least 0.01 TON, what is x2 from average simple transfer fee
                            .storeCoins(valuePerTransfer / 5n)
                            .storeMaybeRef(beginCell().storeUint(0, 32).storeStringTail("Starton rewards").endCell())
                            .endCell()
                    }),
                });
            }
        } else {
            let launchAddress;
            try {
                launchAddress = Address.parse(requestType);
            } catch (e) {
                logger().error(`user ${user} sent bad claim application with comment ${requestType}`);
                return refund(request);
            }
            const rewardPositions = await db.getRewardPositions(user.toRawString(), launchAddress.toRawString());
            if (!rewardPositions) {
                logger().warn(`reward positions gone at some reason for user ${user}`);
                return refund(request);
            }
            const minValuePerTransfer = BigInt(getConfig().ton.fees.jetton_transfer_fee) + BigInt(getConfig().ton.fees.fee_per_call);
            if (attachedValue < BigInt(rewardPositions.length) * minValuePerTransfer) {
                logger().warn(`user ${user} sent not enough value to claim all the positions per launch ${launchAddress.toRawString()}`);
                return refund(request);
            }
            const rewardJettons = await db.getRewardJettons(rewardPositions.map(p => p.rewardJetton));
            if (!rewardJettons || rewardJettons.length < rewardPositions.length) {
                logger().error(`unreachable: corrupted jetton data for [user ${user}; launch ${launchAddress.toRawString()}]`);
                return refund(request);
            }
            const rewardJettonMap: Record<RawAddressString, Omit<RewardJetton, "masterAddress">> = rewardJettons.reduce(
                (acc, { masterAddress, ...rest }) => ({
                    ...acc,
                    [masterAddress]: rest
                }), {}
            );
            const freeValue = attachedValue - (BigInt(getConfig().ton.fees.fee_per_call) * BigInt(rewardPositions.length));
            const valuePerTransfer = freeValue / BigInt(rewardPositions.length);
            const queryId = Math.floor(Date.now() / 1000);
            for (const { rewardJetton, balance } of rewardPositions) {
                actions.push({
                    type: "sendMsg",
                    mode: SendMode.NONE,
                    outMsg: internal_relaxed({
                        to: Address.parse(rewardJettonMap[rewardJetton].ourWalletAddress),
                        value: valuePerTransfer,
                        body: beginCell()
                            .storeUint(JettonOps.Transfer, OP_LENGTH)
                            .storeUint(queryId, QUERY_ID_LENGTH)
                            .storeCoins(balance)
                            .storeAddress(user)
                            .storeAddress(user)
                            .storeMaybeRef()
                            // At least 0.015 TON, what is x3 from average simple transfer fee
                            .storeCoins(valuePerTransfer / 5n)
                            .storeMaybeRef(beginCell().storeUint(0, 32).storeStringTail("Starton rewards").endCell())
                            .endCell()
                    }),
                });
            }
        }

        if (actions.length) {
            const { keyPair, wallet, queryIdManager } = await walletData();
            const highloadQueryId = await queryIdManager.getNextCached();

            let tryNumber = 0;
            while (tryNumber < 3) {
                try {
                    await balancedTonClient.execute(() =>
                        wallet.sendBatch(keyPair.secretKey,
                            actions,
                            SUBWALLET_ID,
                            highloadQueryId,
                            DEFAULT_TIMEOUT,
                        )
                    );
                    await delay(60);
                    const hasBeenProcessed = await balancedTonClient.execute(() =>
                        wallet.getProcessed(highloadQueryId, false)
                    );
                    if (hasBeenProcessed) {
                        logger().info(`successfully sent rewards to user ${user.toRawString()}${requestType !== "t" ? ` ; launch ${Address.parse(requestType).toRawString()}` : ""}`);
                        break;
                    }
                    // All the attempts to send tokens to user has failed at some reason, so we refund 'em
                    if (tryNumber === 3) {
                        logger().error(`all 3 attempts to send rewards to user ${user.toRawString()} has failed, running refund...`);
                        return refund(request);
                    }
                } catch (e) {
                    logger().error(`failed to send rewards to user ${user.toRawString()} with error`, e);
                }
                tryNumber++;
            }
            if (requestType === "t") {
                await db.markUserRewardPositionsAsClaimed(user.toRawString());
                await db.deleteMaybeExtraBalances(user.toRawString());
            } else await db.markUserRewardPositionsAsClaimed(user.toRawString(), Address.parse(requestType).toRawString());
        }
    } catch (e) {
        logger().error(`reward handling for [${user}; $[${requestType}] failed with error: `, e);
    }
}

export async function refund(
    { user, attachedValue }: ClaimRequest
): Promise<void> {
    const { keyPair, wallet, queryIdManager } = await walletData();
    const highloadQueryId = await queryIdManager.getNextCached();

    let tryNumber = 0;
    while (tryNumber < 3) {
        await delay(tryNumber * 8);
        try {
            await balancedTonClient.execute(() =>
                wallet.sendExternalMessage(keyPair.secretKey, {
                    createdAt: Math.floor((Date.now() / 1000) - 10),
                    queryId: highloadQueryId,
                    message: internal_relaxed({
                        to: user,
                        value: attachedValue,
                        body: beginCell()
                            .storeUint(0, 32)
                            .storeStringRefTail("failed to handle the claim rewards request, please contact support")
                            .endCell()
                    }),
                    mode: SendMode.NONE,
                    subwalletId: SUBWALLET_ID,
                    timeout: DEFAULT_TIMEOUT
                })
            );
            logger().info(`successfully refunded user ${user.toRawString()} with value ${fromNano(attachedValue)}`);
            break;
        } catch (e) {
            logger().error(`failed to refund user ${user.toRawString()} with error`, e);
        }
        tryNumber++;
    }
}