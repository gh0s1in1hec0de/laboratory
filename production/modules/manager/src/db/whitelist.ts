import type { RawAddressString, WhitelistRelations } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "../logger";
import { decrementTicketBalance } from "./users.ts";

export async function storeWhitelistRelation(
    tokenLaunchAddress: RawAddressString,
    callerAddress: RawAddressString,
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)<WhitelistRelations[]>`
        INSERT INTO whitelist_relations (token_launch, caller)
        VALUES (${tokenLaunchAddress}, ${callerAddress})
        RETURNING 1
    `;
    if (res.length !== 1) logger().error(`exactly 1 column must be changed, got: ${res}`);
}

export async function buyWhitelist(callerAddress: RawAddressString, tokenLaunchAddress: RawAddressString, client?: SqlClient): Promise<void> {
    await (client ?? globalClient).begin(async sql => {
        await decrementTicketBalance(callerAddress, sql);
        await storeWhitelistRelation(tokenLaunchAddress, callerAddress, sql);
    });
}

export async function checkWhitelistStatus(
    tokenLaunch: RawAddressString,
    caller: RawAddressString,
    client?: SqlClient
): Promise<boolean> {
    const res = await (client ?? globalClient)<{ isWhitelisted: boolean }[]>`
        SELECT CASE
                   WHEN EXISTS(SELECT 1
                               FROM whitelist_exceptions
                               WHERE token_launch = ${tokenLaunch}) THEN TRUE
                   ELSE EXISTS(SELECT 1
                               FROM whitelist_relations
                               WHERE caller = ${caller}
                                 AND token_launch = ${tokenLaunch})
                   END as is_whitelisted
    `;
    return res[0]?.isWhitelisted || false;
}