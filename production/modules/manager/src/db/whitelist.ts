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
        INSERT INTO whitelist_relations (token_launch_address, caller_address)
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