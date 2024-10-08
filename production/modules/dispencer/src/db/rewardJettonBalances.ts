import type { RawAddressString, UserRewardJettonBalance } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";

export async function getRewardJettonBalances(userAddress: RawAddressString, client?: SqlClient): Promise<UserRewardJettonBalance[] | null> {
    const res = await (client ?? globalClient)<UserRewardJettonBalance[]>`
        SELECT *
        FROM user_reward_jetton_balances
        WHERE "user" = ${userAddress}
    `;
    return res.length ? res : null;
}