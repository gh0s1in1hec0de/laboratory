import { type Coins, type RawAddressString, type RewardJetton } from "starton-periphery";
import { globalClient, type SqlClient } from "oracle/src/db";
import { logger } from "oracle/src/logger.ts";

export async function getRewardJetton(masterAddress: RawAddressString, client?: SqlClient): Promise<RewardJetton | null> {
    const res = await (client ?? globalClient)<RewardJetton[]>`
        SELECT *
        FROM reward_jettons
        WHERE master_address = ${masterAddress}
    `;
    return !res.length ? null : res[0];
}

export async function storeRewardJetton(
    { masterAddress, metadata, currentBalance, rewardAmount }: RewardJetton,
    client?: SqlClient
): Promise<void> {
    // @ts-expect-error just postgres typechecking nonsense
    const res = await (client ?? globalClient)`
        INSERT INTO reward_jettons (master_address, metadata, current_balance, reward_amount)
        VALUES (${masterAddress}, ${metadata}, ${currentBalance}, ${rewardAmount})
        RETURNING 1;
    `;
    if (res.length !== 1) logger().warn(`exactly 1 column must be created, got: ${res}`);
}

export async function updateRewardJettonNumbers(
    masterAddress: string,
    newBalance: Coins,
    newRewardAmount: Coins,
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)`
        UPDATE reward_jettons
        SET current_balance = ${newBalance},
            reward_amount   = ${newRewardAmount}
        WHERE master_address = ${masterAddress}
        RETURNING 1;
    `;
    if (res.length !== 1) logger().warn(`exactly 1 row must be updated, got: ${res}`);
}