import type { JettonMetadata, RawAddressString, RewardPool, SortedRewardPools } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";

export async function getSortedRewardPools(
    tokenLaunches: RawAddressString,
    { page, limit }: { page: number, limit: number },
    client?: SqlClient
): Promise<SortedRewardPools | null> {
    const offset = (page - 1) * limit;
    const c = client ?? globalClient;
    const res = await c<
        (RewardPool & { metadata: JettonMetadata })[]
    >`
        SELECT rp.*, rj.metadata
        FROM reward_pools rp
                 JOIN reward_jettons rj ON rp.reward_jetton = rj.master_address
        WHERE rp.token_launch = ${tokenLaunches}
        ORDER BY rp.reward_amount DESC
            ${page && limit ? c`LIMIT ${limit + 1} OFFSET ${offset}` : c``}
    `;
    return !res.length ? null : {
        rewardPools: res.slice(0, limit),
        hasMore: res.length > limit
    };
}

export async function upsertRewardPool(
    { tokenLaunch, rewardJetton, rewardAmount }: RewardPool,
    client?: SqlClient
): Promise<boolean> {
    const res = await (client ?? globalClient)<
        { shouldHaveBeenUpdated: boolean, wasUpdated: boolean, wasDeleted: boolean }[]
    >`
        WITH launch_check AS (SELECT 1
                              FROM token_launches
                              WHERE address = ${tokenLaunch}
                                AND is_successful IS NULL),
             current_pool AS (SELECT reward_amount
                              FROM reward_pools
                              WHERE token_launch = ${tokenLaunch}
                                AND reward_jetton = ${rewardJetton}),
             reward_diff AS (SELECT ${rewardAmount} - COALESCE(reward_amount, 0) AS diff
                             FROM current_pool),
             jetton_check AS (SELECT current_balance, locked_for_rewards
                              FROM reward_jettons
                              WHERE master_address = ${rewardJetton}
                                AND current_balance - locked_for_rewards >= (SELECT diff FROM reward_diff)
                                  FOR UPDATE),
             deletion_request AS (SELECT ${rewardAmount}::BIGINT = 0::BIGINT AS should_delete),
             upsert AS (
                 INSERT INTO reward_pools (token_launch, reward_jetton, reward_amount)
                     VALUES (${tokenLaunch}, ${rewardJetton}, ${rewardAmount})
                     ON CONFLICT (token_launch, reward_jetton) DO UPDATE
                         SET reward_amount = EXCLUDED.reward_amount
                         WHERE NOT (SELECT should_delete FROM deletion_request) -- Only perform upsert if rewardAmount is non-zero
                     RETURNING 1),
             delete_if_zero AS (
                 DELETE FROM reward_pools
                     WHERE token_launch = ${tokenLaunch}
                         AND reward_jetton = ${rewardJetton}
                         AND (SELECT should_delete FROM deletion_request)
                     RETURNING 1)
        UPDATE reward_jettons
        SET locked_for_rewards = locked_for_rewards + (SELECT diff FROM reward_diff)
        WHERE master_address = ${rewardJetton}
          AND EXISTS (SELECT 1 FROM launch_check)
          AND EXISTS (SELECT 1 FROM jetton_check)
        -- Started working after those 3 SELECTs, fucking mystery or shitty query building system, hmm, postgres-js?
        RETURNING
                (SELECT should_delete FROM deletion_request) AS should_have_been_deleted,
                (SELECT COUNT(*) > 0 FROM upsert) AS was_updated,
                (SELECT COUNT(*) > 0 FROM delete_if_zero) AS was_deleted;
    `;
    return !!res.length;
}

