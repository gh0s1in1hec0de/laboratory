import type { RawAddressString } from "starton-periphery";
import { getConfig } from "../../../config.ts";
import { logger } from "../../../logger";
import { Address } from "@ton/core";
import * as db from "../../../db";
import { ok as assert } from "node:assert";

export async function getAmount(
    { userAddress, tokenLaunch, }: { userAddress: RawAddressString, tokenLaunch?: RawAddressString },
): Promise<bigint | string> {
    try {
        const parsedUserAddress = Address.parse(userAddress);
        if (tokenLaunch) {
            const parsedLaunchAddress = Address.parse(tokenLaunch);
            const launchRewardPositions = await db.getRewardPositions(
                parsedUserAddress.toRawString(), parsedLaunchAddress.toRawString()
            );
            assert(launchRewardPositions, `No rewards found for [${userAddress}, ${tokenLaunch}]`);

            return BigInt(launchRewardPositions.length) * getConfig().ton.jetton_transfer_fee;
        } else {
            const rewardJettonBalances = await db.getRewardJettonBalances(parsedUserAddress.toRawString());
            assert(rewardJettonBalances, `No rewards found for ${userAddress}`);
            return BigInt(rewardJettonBalances.length) * getConfig().ton.jetton_transfer_fee;
        }
    } catch (e) {
        logger().error(`error in http request 'connectWallet': ${e}`);
        return `error: ${e}`;
    }
}