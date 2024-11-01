import type { JettonMetadata, RawAddressString, RewardPool } from "starton-periphery";
import type { SqlClient } from "./types.ts";
import { globalClient } from "./db.ts";

export async function getRewardPools(
    tokenLaunches: RawAddressString[], client?: SqlClient
): Promise<(RewardPool & { metadata: JettonMetadata })[] | null> {
    const res = await (client ?? globalClient)<
        (RewardPool & { metadata: JettonMetadata })[]
    >`
        SELECT rp.*, rj.metadata
        FROM reward_pools rp
                 JOIN reward_jettons rj ON rp.reward_jetton = rj.master_address
        WHERE rp.token_launch = ANY (${tokenLaunches}::address[])
    `;
    return res.length ? res : null;
}
