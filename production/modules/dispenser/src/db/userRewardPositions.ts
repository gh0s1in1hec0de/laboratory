import type { RawAddressString, UserLaunchRewardPosition } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "../logger";

export async function getRewardPositions(userAddress: RawAddressString, tokenLaunch?: RawAddressString, client?: SqlClient): Promise<UserLaunchRewardPosition[] | null> {
    const c = client ?? globalClient;
    const res = await c<UserLaunchRewardPosition[]>`
        SELECT *
        FROM user_launch_reward_positions
        WHERE "user" = ${userAddress}
            ${tokenLaunch ? c`AND token_launch = ${tokenLaunch}` : c``}
    `;
    return res.length ? res : null;
}

// The concisest shit I have ever seen I swear (rules all the stuff through triggers)
export async function markUserRewardPositionsAsClaimed(userAddress: RawAddressString, tokenLaunch?: RawAddressString, client?: SqlClient): Promise<void> {
    const c = client ?? globalClient;
    const res = await c`
        UPDATE user_launch_reward_positions
        SET status = 'claimed'
        WHERE "user" = ${userAddress}
            ${tokenLaunch ? c`AND token_launch = ${tokenLaunch}` : c``}
        RETURNING 1;
    `;
    if (res.length === 0) logger().error(`marked 0 reward positions as claimed for [${userAddress}; ${tokenLaunch ?? ""}]`);

}