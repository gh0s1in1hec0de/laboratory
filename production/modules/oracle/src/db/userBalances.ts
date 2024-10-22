import type { ExtendedUserBalance, RawAddressString } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";

export async function getCallerBalances(address: RawAddressString, launch?: RawAddressString, client?: SqlClient): Promise<ExtendedUserBalance[] | null> {
    const c = client ?? globalClient;

    const res = await c<ExtendedUserBalance[]>`
        SELECT ub.*,
               tl.is_successful,
               (tl.timings ->> 'endTime')::INTEGER AS active_until,
               tl.metadata
        FROM user_balances ub
                 JOIN token_launches tl ON ub.token_launch = tl.address
        WHERE ub.caller = ${address}
            ${launch ? c`AND ub.token_launch = ${launch}` : c``};
    `;
    return res.length ? res : null;
}