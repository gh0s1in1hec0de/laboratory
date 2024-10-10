import { internal as internal_relaxed } from "@ton/core/dist/types/_helpers";
import { fromNano, type OutActionSendMsg, SendMode } from "@ton/ton";
import { chiefWalletData } from "oracle/src/oracle/highload";
import { Address, beginCell } from "@ton/core";
import { balancedTonClient } from "../client";
import { getConfig } from "../config";
import { logger } from "../logger";
import * as db from "../db";
import {
    SUBWALLET_ID, DEFAULT_TIMEOUT,
    OP_LENGTH, QUERY_ID_LENGTH,
    type RawAddressString,
    type RewardJetton,
    type Coins,
    JettonOps,
    delay,
} from "starton-periphery";
import type { ClaimRequest } from "./scanner.ts";

export async function handleMaybeClaimRequest(
    { user, requestType, attachedValue }: ClaimRequest
) {
    const actions: OutActionSendMsg[] = [];

    if (requestType === "t") {
        // All the balances
        const rewardBalances = await db.getRewardJettonBalances(user.toRawString());
        if (!rewardBalances) {
            logger().warn(`reward balances gone at some reason for user ${user}`);
            return refund(user, attachedValue);
        }
        if (attachedValue < BigInt(rewardBalances.length) * getConfig().ton.jetton_transfer_fee) {
            logger().warn(`user ${user} sent not enough value to claim all the balances`);
            return refund(user, attachedValue);
        }
        const rewardJettons = await db.getRewardJettons(rewardBalances.map(p => p.rewardJetton));
        if (!rewardJettons || rewardJettons.length < rewardBalances.length) {
            logger().error(`unreachable: corrupted jetton data for user ${user} total`);
            return refund(user, attachedValue);
        }
        const rewardJettonMap: Record<RawAddressString, Omit<RewardJetton, "masterAddress">> = rewardJettons.reduce(
            (acc, { masterAddress, ...rest }) => ({
                ...acc,
                [masterAddress]: rest
            }), {}
        );
        const valuePerTransfer = attachedValue / BigInt(rewardBalances.length);
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
                        // At least 0.015 TON, what is x3 from average simple transfer fee
                        .storeCoins(valuePerTransfer * 3n / 10n)
                        .storeMaybeRef(beginCell().storeUint(0, 32).storeStringTail("starton rewards $v$").endCell())
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
            return refund(user, attachedValue);
        }
        const rewardPositions = await db.getRewardPositions(user.toRawString(), launchAddress.toRawString());
        if (!rewardPositions) {
            logger().warn(`reward positions gone at some reason for user ${user}`);
            return refund(user, attachedValue);
        }
        if (attachedValue < BigInt(rewardPositions.length) * getConfig().ton.jetton_transfer_fee) {
            logger().warn(`user ${user} sent not enough value to claim all the positions per launch ${launchAddress.toRawString()}`);
            return refund(user, attachedValue);
        }
        const rewardJettons = await db.getRewardJettons(rewardPositions.map(p => p.rewardJetton));
        if (!rewardJettons || rewardJettons.length < rewardPositions.length) {
            logger().error(`unreachable: corrupted jetton data for [user ${user}; launch ${launchAddress.toRawString()}]`);
            return refund(user, attachedValue);
        }
        const rewardJettonMap: Record<RawAddressString, Omit<RewardJetton, "masterAddress">> = rewardJettons.reduce(
            (acc, { masterAddress, ...rest }) => ({
                ...acc,
                [masterAddress]: rest
            }), {}
        );
        const valuePerTransfer = attachedValue / BigInt(rewardPositions.length);
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
                        .storeCoins(valuePerTransfer * 3n / 10n)
                        .storeMaybeRef(beginCell().storeUint(0, 32).storeStringTail("starton rewards $v$").endCell())
                        .endCell()
                }),
            });
        }
    }

    if (actions.length) {
        const { keyPair, wallet, queryIdManager } = await chiefWalletData();
        const highloadQueryId = await queryIdManager.getNextCached();

        let tryNumber = 0;
        while (tryNumber < 3) {
            await delay(tryNumber * 8);
            try {
                await balancedTonClient.execute(() =>
                    wallet.sendBatch(keyPair.secretKey,
                        actions,
                        SUBWALLET_ID,
                        highloadQueryId,
                        DEFAULT_TIMEOUT,
                    )
                );
                logger().info(`successfully sent rewards to user ${user.toRawString()}${requestType !== "t" ? ` ; launch ${Address.parse(requestType).toRawString()}` : ""}`);
                break;
            } catch (e) {
                logger().error(`failed to send rewards to user ${user.toRawString()} with error`, e);
            }
            tryNumber++;
        }
        if (requestType === "t") {
            await db.markUserRewardPositionsAsClaimed(user.toRawString());
            if (await db.getRewardJettonBalances(user.toRawString()))
                logger().error(`inconsistent state reached: not all the balances zeroed for user ${user.toRawString()}`);
        } else await db.markUserRewardPositionsAsClaimed(user.toRawString(), Address.parse(requestType).toRawString());
    }
}

export async function refund(to: Address, value: Coins) {
    const { keyPair, wallet, queryIdManager } = await chiefWalletData();
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
                        to, value,
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
            logger().info(`successfully refunded user ${to.toRawString()} with value ${fromNano(value)}`);
            break;
        } catch (e) {
            logger().error(`failed to refund user ${to.toRawString()} with error`, e);
        }
        tryNumber++;
    }
}