import type { Caller, RawAddressString } from "starton-periphery";
import type { SqlClient } from "./types.ts";
import { globalClient } from "./db.ts";

export async function getCaller(
    callerAddress: RawAddressString,
    client?: SqlClient
): Promise<Caller | null> {
    const res = await (client ?? globalClient)<Caller[]>`
        SELECT *
        FROM callers
        WHERE address = ${callerAddress}
    `;
    return res.length ? res[0] : null;
}