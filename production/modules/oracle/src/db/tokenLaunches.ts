import type { Coins, RawAddressString } from "starton-periphery";
import { ok as assert } from "assert";
import { globalClient } from "./db";
import type {
    StoredTokenLaunchResponse,
    PostDeployEnrollmentStats,
    StoredTokenLaunchRequest,
    StoredTokenLaunch,
    SqlClient,
    DexData,
} from "./types";

export async function getTokenLaunch(address: RawAddressString, client?: SqlClient): Promise<StoredTokenLaunch | null> {
    const res = await (client ?? globalClient)<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE address = ${address}
    `;
    return res.length ? res[0] : null;
}

// Returns `null` to show that nothing was found the explicit way
export async function getActiveTokenLaunches(createdAt?: Date, client?: SqlClient): Promise<StoredTokenLaunch[] | null> {
    const c = client ?? globalClient;
    const res = await c<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE (timings ->> 'endTime')::TIMESTAMP - now() > INTERVAL '30 seconds'
            ${createdAt ? c`AND created_at > ${createdAt}` : c``};
    `;
    return res.length ? res : null;
}

export async function getTokenLaunchById(id: number, client?: SqlClient): Promise<StoredTokenLaunch | null> {
    const res = await (client ?? globalClient)<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE id = ${id}
    `;
    return res.length ? res[0] : null;
}

export async function storeTokenLaunch(
    { identifier, address, creator, version, metadata, timings }:
        Omit<
            StoredTokenLaunch,
            "createdAt" | "id" | "isSuccessful" | "postDeployEnrollmentStats" | "dexData"
        >,
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)`
        INSERT INTO token_launches (identifier, address, creator, version, metadata, timings)
        VALUES (${identifier}, ${address}, ${creator}, ${version}, ${JSON.stringify(metadata)},
                ${JSON.stringify(timings)})
        RETURNING 1;
    `;
    assert(res.length === 1, `exactly 1 column must be created, got: ${res}`);
}

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

// Queries related to oracles

export enum EndedLaunchesCategories {
    Pending = "pending",
    WaitingForJetton = "waiting_for_jetton",
    WaitingForPool = "waiting_for_pool",
}

// Returns token launches, that have been already ended, needs to be categorized as "successful and waits for deployment"/"unsuccessful"
export async function getTokenLaunchesByCategories(categories: EndedLaunchesCategories[], client?: SqlClient): Promise<StoredTokenLaunch[] | null> {
    const c = client ?? globalClient;
    const res = await c<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE now() > (timings ->> 'publicRoundEndTime')::TIMESTAMP
          AND post_deploy_enrollment_stats IS NULL
            ${categories.includes(EndedLaunchesCategories.Pending) ? c`AND is_successful IS NULL` : c`AND is_successful IS TRUE`} ${categories.includes(EndedLaunchesCategories.WaitingForJetton) ? c`AND post_deploy_enrollment_stats IS NULL` : c`AND post_deploy_enrollment_stats IS NOT NULL`} ${categories.includes(EndedLaunchesCategories.WaitingForPool) ? c`AND (dex_data IS NULL OR (dex_data->>'addedLiquidity')::BOOLEAN = FALSE` : c``}
    `;
    return res.length ? res : null;
}

export async function markLaunchAsFailed(address: RawAddressString, client?: SqlClient): Promise<void> {
    const res = await (client ?? globalClient)`
        UPDATE token_launches
        SET is_successful = FALSE
        WHERE address = ${address}
        RETURNING 1;
    `;
    assert(res.count === 1, "value was not updated");
}

export async function updatePostDeployEnrollmentStats(tokenLaunchAddress: RawAddressString, stats: PostDeployEnrollmentStats, client?: SqlClient): Promise<void> {
    const res = await (client ?? globalClient)`
        UPDATE token_launches
        SET post_deploy_enrollment_stats = ${JSON.stringify(stats)},
            is_successful                = TRUE
        WHERE address = ${tokenLaunchAddress}
        RETURNING 1;
    `;
    assert(res.count === 1, "value was not updated");
}

export async function updateDexData(tokenLaunchAddress: RawAddressString, dexData: DexData, client?: SqlClient): Promise<void> {
    const res = await (client ?? globalClient)`
        UPDATE token_launches
        SET dex_data = ${JSON.stringify(dexData)}
        WHERE address = ${tokenLaunchAddress}
        RETURNING 1;
    `;
    assert(res.count === 1, "value was not updated");
}

export async function updateLaunchBalance(tokenLaunchAddress: RawAddressString, params: {
    creatorTonsCollected?: Coins,
    wlTonsCollected?: Coins,
    totalTonsCollected?: Coins,
}, client?: SqlClient): Promise<void> {
    const { creatorTonsCollected, wlTonsCollected, totalTonsCollected } = params;
    assert(Object.values(params).some(value => value !== undefined), "bullshit");

    const c = client ?? globalClient;
    const res = await c`
        UPDATE launch_balances
        SET ${creatorTonsCollected ? c`creator_tons_collected = ${creatorTonsCollected}` : c``}
                ${wlTonsCollected ? c`wl_tons_collected = ${wlTonsCollected}` : c``}
                    ${totalTonsCollected ? c`total_tons_collected = ${totalTonsCollected}` : c``}
        WHERE address = ${tokenLaunchAddress}
        RETURNING 1;
    `;
    assert(res.count === 1, "value was not updated");
}