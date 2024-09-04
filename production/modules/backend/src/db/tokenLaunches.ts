import type { SqlClient, StoredTokenLaunch, StoredTokenLaunchRequest, StoredTokenLaunchResponse } from "./types";
import type { RawAddressString } from "starton-periphery";
import { ok as assert } from "assert";
import { globalClient } from "./db";

// Returns `null` to show that nothing was found the explicit way
export async function getActiveTokenLaunches(client?: SqlClient): Promise<StoredTokenLaunch[] | null> {
    const res = await (client || globalClient)<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE (timings ->> 'end_time')::TIMESTAMP - now() > INTERVAL '30 seconds';
    `;
    return res.length ? res : null;
}

export async function getTokenLaunch(address: RawAddressString, client?: SqlClient): Promise<StoredTokenLaunch | null> {
    const res = await (client || globalClient)<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE address = ${address}
    `;
    return res.length ? res[0] : null;
}

export async function storeTokenLaunch(
    {
        address,
        creator,
        metadata,
        timings
    }: StoredTokenLaunch,
    client?: SqlClient
): Promise<void> {
    const res = await (client || globalClient)`
        INSERT INTO token_launches (address, creator, metadata, timings)
        VALUES (${address}, ${creator}, ${JSON.stringify(metadata)}, ${JSON.stringify(timings)})
        RETURNING 1;
    `;
    assert(res.length === 1, `exactly 1 column must be created, got: ${res}`);
}

export async function getSortedTokenLaunches(
    {
        page,
        limit,
        sortBy,
        order,
        search = "",
    }: StoredTokenLaunchRequest,
    client?: SqlClient
): Promise<StoredTokenLaunchResponse | null> {
    const offset = (page - 1) * limit;
    const c = client ?? globalClient;

    const res = await c<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE name ILIKE ${`%${search}%`}
        ORDER BY ${c.unsafe(sortBy)} ${c.unsafe(order)}
        LIMIT ${limit + 1} OFFSET ${offset}
    `;
    return !res.length ? null : {
        storedTokenLaunch: res.slice(0, limit),
        hasMore: res.length > limit
    };
}