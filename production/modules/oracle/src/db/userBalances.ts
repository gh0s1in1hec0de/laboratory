import type { SqlClient } from "./types";
import { globalClient } from "./db";
import type {
    GetUserBalancesResponse,
    TokenLaunchTimings,
    StoredUserBalance,
    RawAddressString,
    JettonMetadata
} from "starton-periphery";

export async function getCallerBalances(
    address: RawAddressString, launch?: RawAddressString, client?: SqlClient
): Promise<GetUserBalancesResponse | null> {
    const c = client ?? globalClient;

    const res = await c<
        (StoredUserBalance & JettonMetadata & TokenLaunchTimings & {
            isSuccessful: boolean,
            creator: RawAddressString,
        })[]
    >`
        SELECT ub.*,
               tl.is_successful,
               tl.timings,
               tl.metadata,
               (tl.creator = ${address}) as is_creator
        FROM user_balances ub
                 JOIN token_launches tl ON ub.token_launch = tl.address
        WHERE ub.caller = ${address}
            ${launch ? c`AND ub.token_launch = ${launch}` : c``};
    `;
    return res.length ? res : null;
}