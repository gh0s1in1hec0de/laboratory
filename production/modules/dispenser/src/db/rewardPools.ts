import type { RawAddressString, RewardPool } from "starton-periphery";
import type { SqlClient } from "./types.ts";
import { globalClient } from "./db.ts";

export async function getRewardPools(tokenLaunch: RawAddressString, client?: SqlClient): Promise<RewardPool[] | null> {
    const res = await (client ?? globalClient)<RewardPool[]>`
        SELECT *
        FROM reward_pools
        WHERE token_launch = ${tokenLaunch}
    `;
    return res.length ? res : null;
}