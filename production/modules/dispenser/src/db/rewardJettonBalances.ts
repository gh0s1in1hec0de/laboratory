import type { JettonMetadata, RawAddressString, UserRewardJettonBalance } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";

export async function getRewardJettonBalances(userAddress: RawAddressString, client?: SqlClient): Promise<(UserRewardJettonBalance & { metadata: JettonMetadata})[] | null> {
    const res = await (client ?? globalClient)<(UserRewardJettonBalance & { metadata: JettonMetadata})[]>`
        SELECT urjb.*, rj.metadata
        FROM user_reward_jetton_balances urjb
                 JOIN reward_jettons rj ON urjb.reward_jetton = rj.master_address
        WHERE urjb."user" = ${userAddress}
    `;
    return res.length ? res : null;
}