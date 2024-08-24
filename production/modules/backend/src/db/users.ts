import type { SqlClient, StoredUser } from "./types.ts";
import { globalClient } from "./db.ts";

export async function getUserByAddress(address: string, client?: SqlClient): Promise<StoredUser | null> {
    const res = await (client || globalClient)<StoredUser[]>`
        SELECT *
        FROM users
        WHERE address = ${address}
    `;
    return res.length ? res[0] : null;
}