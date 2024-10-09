import {
    type Coins,
    OP_LENGTH,
    QUERY_ID_LENGTH,
    type RawAddressString,
    type RewardJetton,
    TokensLaunchOps
} from "starton-periphery";
import { type OutActionSendMsg, SendMode } from "@ton/ton";
import { getConfig } from "../config.ts";
import { logger } from "../logger.ts";
import { Address, beginCell, toNano } from "@ton/core";
import * as db from "../db";
import { internal as internal_relaxed } from "@ton/core/dist/types/_helpers";

export async function handleMaybeClaimRequest(
    user: RawAddressString,
    requestType: "t" | RawAddressString,
    attachedValue: Coins
) {
    const actions: OutActionSendMsg[] = [];

    if (requestType === "t") {
        // All the balances
        const rewardPositions = await db.getRewardJettonBalances(user);
        if (!rewardPositions) {
            logger().warn(`reward balances gone at some reason for user ${user}`);
            return refund();
        }
        if (attachedValue < BigInt(rewardPositions.length) * getConfig().ton.jetton_transfer_fee) {
            logger().warn(`user ${user} sent not enough value to claim all the balances`);
            return refund();
        }
        const rewardJettons = await db.getRewardJettons(rewardPositions.map(p => p.rewardJetton));
        if (!rewardJettons || rewardJettons.length < rewardPositions.length) {
            logger().error(`unreachable: corrupted jetton data for user ${user} total`);
            return refund();
        }
        const rewardJettonMap: Record<RawAddressString, Omit<RewardJetton, "masterAddress">> = rewardJettons.reduce(
            (acc, { masterAddress, ...rest }) => ({
                ...acc,
                [masterAddress]: rest
            }), {}
        );
        // TODO
        for (const { rewardJetton, balance } of rewardPositions) {
            actions.push({
                type: "sendMsg",
                mode: SendMode.NONE,
                outMsg: internal_relaxed({
                    to: Address.parse(rewardJettonMap[rewardJetton].ourWalletAddress),
                    value: toNano("0.1"),
                    body: beginCell().endCell()
                }),
            });
        }
    }
    let maybeParsedLaunchAddress;
    try {
        maybeParsedLaunchAddress = Address.parse(requestType);
    } catch (e) {
        logger().error(`user ${user} sent bad claim application with comment ${requestType}`);
        return refund();
    }

}

export async function refund() {

}