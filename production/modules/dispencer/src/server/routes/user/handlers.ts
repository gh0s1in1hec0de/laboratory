import { CommonServerError } from "starton-periphery";
import { getConfig } from "../../../config";
import { Address } from "@ton/core";
import * as db from "../../../db";
import type {
    UserLaunchRewardPosition,
    UserRewardJettonBalance,
    RawAddressString,
    JettonMetadata,
    Coins,
} from "starton-periphery";

// Returned stringified nano-tons user needs to attach to claim application
export async function getAmount(
    { userAddress, tokenLaunch, }: { userAddress: RawAddressString, tokenLaunch?: RawAddressString },
): Promise<string> {
    const parsedUserAddress = Address.parse(userAddress);
    if (tokenLaunch) {
        const parsedLaunchAddress = Address.parse(tokenLaunch);
        const launchRewardPositions = await db.getRewardPositions(
            parsedUserAddress.toRawString(), parsedLaunchAddress.toRawString()
        );
        if (!launchRewardPositions) throw new CommonServerError(400, `No rewards found for [${userAddress}, ${tokenLaunch}]`);

        return (BigInt(launchRewardPositions.length) * getConfig().ton.jetton_transfer_fee).toString();
    } else {
        const rewardJettonBalances = await db.getRewardJettonBalances(parsedUserAddress.toRawString());
        if (!rewardJettonBalances) throw new CommonServerError(400, `No rewards found for ${userAddress}`);

        return (BigInt(rewardJettonBalances.length) * getConfig().ton.jetton_transfer_fee).toString();
    }
}

export type RewardJettonResponse = {
    [rewardJetton: string]: {
        rewardAmount: Coins,
        metadata: JettonMetadata,
    },
};

export async function getLaunchRewardPools(
    { tokenLaunch }: { tokenLaunch: RawAddressString }
): Promise<RewardJettonResponse | null> {
    const rewardPools = await db.getRewardPools(Address.parse(tokenLaunch).toRawString());
    if (!rewardPools) return null;

    const rewardJettons = await db.getRewardJettons(
        rewardPools.map(pool => pool.rewardJetton)
    );
    if (!rewardJettons || rewardJettons.length !== rewardPools.length)
        throw new CommonServerError(500, "Internal data has been corrupted");

    return rewardPools.reduce<RewardJettonResponse>((acc, pool) => {
        const jetton = rewardJettons.find(j => j.masterAddress === pool.rewardJetton);
        if (jetton) {
            acc[pool.rewardJetton] = {
                rewardAmount: pool.rewardAmount,
                metadata: jetton.metadata,
            };
        }
        return acc;
    }, {});
}


export type MappedUserLaunchRewardPositions = {
    [tokenLaunch: RawAddressString]: UserLaunchRewardPosition[],
};

export async function getRewardPositions(
    { userAddress, tokenLaunch }: { userAddress: RawAddressString, tokenLaunch?: RawAddressString },
): Promise<MappedUserLaunchRewardPositions | null> {
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
        {} as MappedUserLaunchRewardPositions
    ) : null;
}

export async function getRewardBalances(
    { userAddress }: { userAddress: RawAddressString },
): Promise<UserRewardJettonBalance[] | null> {
    return await db.getRewardJettonBalances(Address.parse(userAddress).toRawString());
}