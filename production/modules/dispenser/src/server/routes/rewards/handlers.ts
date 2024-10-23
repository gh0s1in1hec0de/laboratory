import { CommonServerError } from "starton-periphery";
import { getConfig } from "../../../config";
import { Address } from "@ton/core";
import * as db from "../../../db";
import type {
    GetRewardJettonBalancesResponse,
    GetRewardJettonBalancesRequest,
    GetRewardPositionsResponse,
    GetRewardPositionsRequest,
    GetRewardPoolsResponse,
    MappedRewardPositions,
    GetRewardPoolsRequest,
    GetAmountRequest,
} from "starton-periphery";

// Returned stringified nano-tons user needs to attach to claim application
export async function getAmount(
    { userAddress, tokenLaunch, }: GetAmountRequest,
): Promise<string> {
    const parsedUserAddress = Address.parse(userAddress);
    if (tokenLaunch) {
        const parsedLaunchAddress = Address.parse(tokenLaunch);
        const launchRewardPositions = await db.getRewardPositions(
            parsedUserAddress.toRawString(), parsedLaunchAddress.toRawString()
        );
        if (!launchRewardPositions) throw new CommonServerError(400, `No rewards found for [${userAddress}, ${tokenLaunch}]`);

        return (BigInt(launchRewardPositions.length) * BigInt(getConfig().ton.jetton_transfer_fee)).toString();
    } else {
        const rewardJettonBalances = await db.getRewardJettonBalances(parsedUserAddress.toRawString());
        if (!rewardJettonBalances) throw new CommonServerError(400, `No rewards found for ${userAddress}`);

        return (BigInt(rewardJettonBalances.length) * BigInt(getConfig().ton.jetton_transfer_fee)).toString();
    }
}

export async function getLaunchRewardPools(
    { tokenLaunch }: GetRewardPoolsRequest
): Promise<GetRewardPoolsResponse> {
    return await db.getRewardPools(Address.parse(tokenLaunch).toRawString());
}

export async function getRewardPositions(
    { userAddress, tokenLaunch }: GetRewardPositionsRequest,
): Promise<GetRewardPositionsResponse> {
    const rewardPositions = await db.getRewardPositions(
        Address.parse(userAddress).toRawString(), tokenLaunch ? Address.parse(tokenLaunch).toRawString() : undefined
    );
    return rewardPositions ? rewardPositions.reduce(
        (acc, position) => {
            const { tokenLaunch } = position;
            if (!acc[tokenLaunch]) acc[tokenLaunch] = [];
            acc[tokenLaunch].push(position);
            return acc;
        },
        {} as MappedRewardPositions
    ) : null;
}

export async function getRewardBalances(
    { userAddress }: GetRewardJettonBalancesRequest,
): Promise<GetRewardJettonBalancesResponse> {
    return await db.getRewardJettonBalances(Address.parse(userAddress).toRawString());
}