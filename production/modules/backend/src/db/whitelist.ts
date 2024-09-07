import type { SqlClient, StoredWhitelistRelations } from "./types";
import { globalClient } from "./db";

export async function storeWhitelistRelations(
    tokenLaunchAddress: string,
    callerAddress: string,
    client?: SqlClient
): Promise<StoredWhitelistRelations | null> {
    const res = await (client ?? globalClient)<StoredWhitelistRelations[]>`
        INSERT INTO whitelist_relations (token_launch_address, caller_address)
        VALUES (${tokenLaunchAddress}, ${callerAddress})
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}

export async function storeUserTaskRelations(
    userAddress: string,
    taskId: string,
    client?: SqlClient
): Promise<StoredWhitelistRelations | null> {
    const res = await (client ?? globalClient)<StoredWhitelistRelations[]>`
        INSERT INTO users_tasks_relation (caller, task)
        VALUES (${userAddress}, ${taskId})
        ON CONFLICT DO NOTHING
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}