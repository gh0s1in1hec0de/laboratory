import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "../logger";
import type {
    SortedRewardJettons,
    RawAddressString,
    RewardJetton,
} from "starton-periphery";

export async function getRewardJetton(masterAddress: RawAddressString, client?: SqlClient): Promise<RewardJetton | null> {
    const res = await (client ?? globalClient)<RewardJetton[]>`
        SELECT *
        FROM reward_jettons
        WHERE master_address = ${masterAddress}
    `;
    return !res.length ? null : res[0];
}

export async function upsertRewardJetton(
    {
        masterAddress,
        ourWalletAddress,
        metadata,
        currentBalance,
        rewardAmount,
        isActive
    }: Omit<RewardJetton, "lockedForRewards">,
    client?: SqlClient
): Promise<void> {
    // @ts-expect-error just postgres typechecking nonsense
    const res = await (client ?? globalClient)`
        INSERT INTO reward_jettons (master_address, metadata, our_wallet_address, current_balance, reward_amount,
                                    is_active)
        VALUES (${masterAddress}, ${metadata}, ${ourWalletAddress}, ${currentBalance}, ${rewardAmount}, ${isActive})
        ON CONFLICT (master_address)
            DO UPDATE
            SET current_balance    = EXCLUDED.current_balance,
                reward_amount      = EXCLUDED.reward_amount,
                is_active          = EXCLUDED.is_active,
                our_wallet_address = EXCLUDED.our_wallet_address,
                metadata           = EXCLUDED.metadata
        RETURNING 1;
    `;
    if (res.length !== 1) logger().warn(`exactly 1 row must be affected, got: ${res}`);
}

export async function getSortedRewardJettons(
    { page, limit }: { page: number, limit: number },
    client?: SqlClient
): Promise<SortedRewardJettons | null> {
    const offset = (page - 1) * limit;
    const c = client ?? globalClient;

    const res = await c<RewardJetton[]>`
        SELECT *
        FROM reward_jettons
        ORDER BY current_balance DESC
            ${page && limit ? c`LIMIT ${limit + 1} OFFSET ${offset}` : c``}
    `;

    return !res.length ? null : {
        rewardJettons: res.slice(0, limit),
        hasMore: res.length > limit
    };
}