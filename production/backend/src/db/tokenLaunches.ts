import type { SqlClient, StoredTokenLaunch } from "./types";
import type { RawAddressString } from "../utils";
import { globalClient } from "./db";

// Returns `null` to show that nothing was found the explicit way
export async function getActiveTokenLaunches(client?: SqlClient): Promise<StoredTokenLaunch[] | null> {
    const res = await (client || globalClient)<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE end_time - now() > INTERVAL '30 seconds';
    `;
    return res.length ? res : null;
}

export async function getTokenLaunch(address: RawAddressString, client?: SqlClient): Promise<StoredTokenLaunch | null> {
    const res = await (client || globalClient)<StoredTokenLaunch[]>`
        SELECT * FROM token_launches WHERE address = ${address}
    `;
    return res.length ? res[0] : null;
}