import { globalClient } from "./db";
import type {
    StoredTokenLaunchResponse,
    StoredTokenLaunchRequest,
    StoredTokenLaunch,
    SqlClient,
} from "./types";

export async function getSortedTokenLaunches(
    {
        page,
        limit,
        orderBy,
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
        WHERE identifier ILIKE ${`%${search}%`}
        ORDER BY ${c.unsafe(orderBy)} ${c.unsafe(order)}
        LIMIT ${limit + 1} OFFSET ${offset}
    `;
    return !res.length ? null : {
        storedTokenLaunch: res.slice(0, limit),
        hasMore: res.length > limit
    };
}
