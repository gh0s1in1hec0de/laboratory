import type { RawAddressString, RewardJetton } from "starton-periphery";
import type { SqlClient } from "./types.ts";
import { globalClient } from "./db.ts";

export async function getRewardJettons(masterAddresses: RawAddressString[], client?: SqlClient): Promise<RewardJetton[] | null> {
    const res = await (client ?? globalClient)<RewardJetton[]>`
        SELECT * FROM reward_jettons
        WHERE master_address = ANY(${masterAddresses}::TEXT[]);
    `;
    return res.length ? res : null;
}