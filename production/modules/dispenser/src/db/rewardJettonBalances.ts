import type { JettonMetadata, RawAddressString, UserRewardJettonBalance } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";

export async function getRewardJettonBalances(
    userAddress: RawAddressString, client?: SqlClient
): Promise<(UserRewardJettonBalance & { metadata: JettonMetadata })[] | null> {
    const res = await (client ?? globalClient)<
        (UserRewardJettonBalance & { metadata: JettonMetadata })[]
    >`
        SELECT urjb.*, rj.metadata
        FROM user_reward_jetton_balances urjb
                 JOIN reward_jettons rj ON urjb.reward_jetton = rj.master_address
        WHERE urjb."user" = ${userAddress}
    `;
    return res.length ? res : null;
}

export async function deleteMaybeExtraBalances(
    userAddress: RawAddressString,
    client?: SqlClient
): Promise<void> {
    await (client ?? globalClient)`
        WITH delete_user_balances AS (
            DELETE FROM user_reward_jetton_balances
                WHERE "user" = ${userAddress}
                RETURNING reward_jetton, balance)
        UPDATE reward_jettons
        SET locked_for_rewards = GREATEST(locked_for_rewards - delete_user_balances.balance, 0),
            current_balance    = GREATEST(current_balance - delete_user_balances.balance, 0)
        FROM delete_user_balances
        WHERE reward_jettons.master_address = delete_user_balances.reward_jetton
        RETURNING 1;
    `;
}


