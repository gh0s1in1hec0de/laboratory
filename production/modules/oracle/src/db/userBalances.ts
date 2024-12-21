import type { Coins, ExtendedUserBalance, RawAddressString, } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "../logger.ts";

export async function getCallerBalances(
    address: RawAddressString, launch?: RawAddressString, client?: SqlClient
): Promise<ExtendedUserBalance[] | null> {
    const c = client ?? globalClient;

    const res = await c<ExtendedUserBalance[]>`
        SELECT ub.*,
               tl.is_successful,
               tl.version,
               tl.timings,
               tl.metadata,
               tl.total_supply,
               (tl.creator = ${address}) as is_creator
        FROM user_balances ub
                 JOIN token_launches tl ON ub.token_launch = tl.address
        WHERE ub.caller = ${address}
            ${launch ? c`AND ub.token_launch = ${launch}` : c``};
    `;
    return res.length ? res : null;
}

export async function storeUserBalance(
    caller: RawAddressString,
    tokenLaunch: RawAddressString,
    { whitelistTons = 0n, publicTons = 0n, jettons = 0n }:
    { whitelistTons?: Coins, publicTons?: Coins, jettons?: Coins },
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)`
        INSERT INTO user_balances
            (caller, token_launch, whitelist_tons, public_tons, jettons)
        VALUES (${caller}, ${tokenLaunch}, ${whitelistTons}, ${publicTons}, ${jettons})
        RETURNING 1;
    `;
    if (res.length !== 1) logger().warn(`Exactly 1 row must be inserted, got: ${res.length}`);
}
