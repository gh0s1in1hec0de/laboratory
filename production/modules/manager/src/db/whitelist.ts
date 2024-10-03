import type { SqlClient, StoredWhitelistRelations } from "./types";
import { globalClient } from "./db";
import type { RawAddressString } from "starton-periphery";

export async function storeWhitelistRelation(
    tokenLaunchAddress: string,
    callerAddress: RawAddressString,
    client?: SqlClient
): Promise<StoredWhitelistRelations | null> {
    const res = await (client ?? globalClient)<StoredWhitelistRelations[]>`
        INSERT INTO whitelist_relations (token_launch_address, caller_address)
        VALUES (${tokenLaunchAddress}, ${callerAddress})
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}