import type { RawAddressString, WhitelistRelations } from "starton-periphery";
import { decrementTicketBalance } from "./users";
import type { SqlClient } from "./types";
import { globalClient } from "./db";

export async function storeWhitelistRelation(
    tokenLaunchAddress: RawAddressString,
    callerAddress: RawAddressString,
    client?: SqlClient
): Promise<WhitelistRelations | null> {
    const res = await (client ?? globalClient)<WhitelistRelations[]>`
        INSERT INTO whitelist_relations (token_launch, caller)
        VALUES (${tokenLaunchAddress}, ${callerAddress})
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}

export async function buyWhitelist(callerAddress: RawAddressString, tokenLaunchAddress: string, client?: SqlClient): Promise<void> {
    return await (client ?? globalClient).begin(sql => {
        decrementTicketBalance(callerAddress, sql);
        storeWhitelistRelation(tokenLaunchAddress, callerAddress, sql);
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