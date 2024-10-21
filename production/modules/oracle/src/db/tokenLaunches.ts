import { LaunchSortParameters } from "starton-periphery";
import { getLaunchesMetadata } from "./periphery";
import type {
    TokenLaunchTimings, StoredTokenLaunch, UnixTimeSeconds,
    StoredTokenLaunchRequest, StoredTokenLaunchResponse,
    ExtendedLaunchWithMetadata, CertainLaunchRequest,
    Coins, DexData, PostDeployEnrollmentStats,
    RawAddressString, LaunchBalance,
} from "starton-periphery";
import type { SqlClient } from "./types";
import { ok as assert } from "assert";
import { globalClient } from "./db";
import { logger } from "../logger";
import postgres from "postgres";

// Warning! In runtime, when `StoredTokenLaunch` is returned - `TokenLaunchTimings`' fields are strings.
// So - be careful, when using it - its better convert it via `new Date()`.
export async function getTokenLaunch(address: RawAddressString, client?: SqlClient): Promise<StoredTokenLaunch | null> {
    const res = await (client ?? globalClient)<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE address = ${address}
    `;
    return res.length ? res[0] : null;
}

// Returns `null` to show that nothing was found the explicit way
export async function getActiveTokenLaunches(createdAt?: UnixTimeSeconds, client?: SqlClient): Promise<StoredTokenLaunch[] | null> {
    const c = client ?? globalClient;
    const res = await c<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE (timings ->> 'endTime')::BIGINT - EXTRACT(EPOCH FROM now()) > 30
          AND created_at > ${createdAt ? createdAt : 0};
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
    {
        address, identifier, creator,
        version, metadata, timings,
        totalSupply, platformShare,
        minTonTreshold, createdAt
    }:
        Omit<
            StoredTokenLaunch,
            "id" | "isSuccessful" | "postDeployEnrollmentStats" | "dexData"
        >,
    client?: SqlClient
): Promise<void> {
    // @ts-expect-error just postgres typechecking nonsense
    const res = await (client ?? globalClient)`
        INSERT INTO token_launches
        (address, identifier, creator, version, metadata, timings, total_supply, platform_share, min_ton_treshold,
         created_at)
        VALUES (${address}, ${identifier}, ${creator}, ${version}, ${metadata}, ${timings}, ${totalSupply},
                ${platformShare}, ${minTonTreshold}, ${createdAt})
        RETURNING 1;
    `;
    if (res.length !== 1) logger().warn(`exactly 1 column must be created, got: ${res}`);
}

async function getActiveHoldersForLaunches(
    addresses: RawAddressString[],
    client?: SqlClient
): Promise<Map<RawAddressString, number>> {
    const res = await (client ?? globalClient)<{ tokenLaunch: RawAddressString, activeHolders: number }[]>`
        SELECT token_launch, COUNT(*) AS active_holders
        FROM user_balances
        WHERE token_launch = ANY (${addresses})
        GROUP BY token_launch;
    `;
    return new Map<RawAddressString, number>(res.map(r => [r.tokenLaunch, r.activeHolders]));
}

export async function getSortedTokenLaunches(
    { page, limit, orderBy, order, succeed, createdBy, search }: StoredTokenLaunchRequest,
    client?: SqlClient
): Promise<StoredTokenLaunchResponse | null> {
    const offset = (page - 1) * limit;
    const c = client ?? globalClient;
    const orderByExpression = {
        [LaunchSortParameters.CREATED_AT]: c.unsafe(`tl.${orderBy} ${order}`),
        [LaunchSortParameters.TOTAL_TONS_COLLECTED]: c.unsafe(`lb.${orderBy} ${order}`),
    }[orderBy];

    const res = await c<(StoredTokenLaunch & LaunchBalance)[]>`
        SELECT tl.*, lb.*
        FROM token_launches tl
                 JOIN launch_balances lb
                      ON tl.address = lb.token_launch
        WHERE tl.identifier ILIKE ${`%${search ?? ""}%`}
            ${succeed !== undefined ? c`AND tl.is_successful = ${succeed}` : c``}
            ${createdBy ? c`AND tl.creator = ${createdBy}` : c``}
        ORDER BY tl.platform_share DESC, ${orderByExpression}
        LIMIT ${limit + 1} OFFSET ${offset};
    `;
    const activeHolders = await getActiveHoldersForLaunches(
        res.map(l => l.address)
    );
    const launchesChunk = res.map(l =>
        ({ ...l, activeHolders: activeHolders.get(l.address) ?? 0 })
    ).slice(0, limit);

    return !res.length ? null : {
        launchesChunk,
        hasMore: res.length > limit
    };
}

export async function getLaunch({
    address,
    metadataUri
}: CertainLaunchRequest, client?: SqlClient): Promise<ExtendedLaunchWithMetadata | null> {
    const c = client ?? globalClient;
    const condition = address ?
        c`tl.address = ${address}` :
        c`(tl.metadata ->> 'uri')::TEXT = ${metadataUri!}`;

    const res = await c<(StoredTokenLaunch & LaunchBalance)[]>`
        SELECT tl.*, lb.*
        FROM token_launches tl
                 JOIN launch_balances lb
                      ON tl.address = lb.token_launch
        WHERE ${condition}
    `;
    if (!res.length) return null;
    if (res.length > 1) logger().error(`unreachable: found more than 1 launches for ${address ? address : metadataUri}`);

    const launch = res[0];
    const activeHolders = (await getActiveHoldersForLaunches([launch.address])).get(launch.address) ?? 0;
    const offchainMetadata = await getLaunchesMetadata([launch.metadata.uri!]);
    if (!offchainMetadata || offchainMetadata.length !== 1) throw new Error("offchain metadata must exist for launch");

    return { ...launch, activeHolders, offchainMetadata: offchainMetadata[0] };
}


// Queries related to oracles
export enum EndedLaunchesCategories {
    Pending = "pending",
    WaitingForJetton = "waiting_for_jetton",
    WaitingForPool = "waiting_for_pool",
}

// Returns token launches, that have been already ended, needs to be categorized as "successful and waits for deployment"/"unsuccessful"
export async function getTokenLaunchesByCategories(category: EndedLaunchesCategories, client?: SqlClient): Promise<StoredTokenLaunch[] | null> {
    const c = client ?? globalClient;
    const isSuccessful = c`AND is_successful IS TRUE`;

    let q;
    switch (category) {
        case EndedLaunchesCategories.Pending:
            q = c`AND is_successful IS NULL`;
            break;
        case EndedLaunchesCategories.WaitingForJetton:
            q = c`${isSuccessful} AND post_deploy_enrollment_stats IS NULL`;
            break;
        case EndedLaunchesCategories.WaitingForPool:
            q = c`${isSuccessful} AND post_deploy_enrollment_stats IS NOT NULL AND (dex_data IS NULL OR (dex_data ->> 'addedLiquidity')::BOOLEAN = FALSE)`;
            break;
    }
    const res = await c<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE EXTRACT(EPOCH FROM now()) > (timings ->> 'publicRoundEndTime')::BIGINT ${q}
    `;
    return res.length ? res : null;
}

export async function updateLaunchTimings(tokenLaunchAddress: RawAddressString, newTimings: TokenLaunchTimings, client?: SqlClient): Promise<void> {
    // @ts-expect-error just postgres typechecking nonsense
    const res = await (client ?? globalClient)`
        UPDATE token_launches
        SET timings = ${newTimings}
        WHERE address = ${tokenLaunchAddress}
        RETURNING 1;
    `;
    if (res.length !== 1) logger().error(`looks like timings for ${tokenLaunchAddress} wasn't updated`);
}

export async function markLaunchAsFailed(address: RawAddressString, client?: SqlClient): Promise<void> {
    const res = await (client ?? globalClient)`
        UPDATE token_launches
        SET is_successful = FALSE
        WHERE address = ${address}
        RETURNING 1;
    `;
    if (res.length !== 1) logger().error(`looks like launch ${address} wasn't marked as failed`);
}

export async function updatePostDeployEnrollmentStats(tokenLaunchAddress: RawAddressString, stats: PostDeployEnrollmentStats, client?: SqlClient): Promise<void> {
    // @ts-expect-error just postgres typechecking nonsense
    const res = await (client ?? globalClient)`
        UPDATE token_launches
        SET post_deploy_enrollment_stats = ${stats}::JSONB,
            is_successful                = TRUE
        WHERE address = ${tokenLaunchAddress}
        RETURNING 1;
    `;
    if (res.length !== 1) logger().error(`looks like enrollment stats for ${tokenLaunchAddress} wasn't updated`);
}

export async function updateDexData(tokenLaunchAddress: RawAddressString, dexData: DexData, client?: SqlClient): Promise<void> {
    // @ts-expect-error just postgres typechecking nonsense
    const res = await (client ?? globalClient)`
        UPDATE token_launches
        SET dex_data = ${dexData}
        WHERE address = ${tokenLaunchAddress}
        RETURNING 1;
    `;
    if (res.length !== 1) logger().error(`looks like dexdata for ${tokenLaunchAddress} wasn't updated`);
}

export async function updateLaunchBalance(tokenLaunchAddress: RawAddressString, params: {
    creatorTonsCollected?: Coins,
    wlTonsCollected?: Coins,
    totalTonsCollected?: Coins,
}, client?: SqlClient): Promise<void> {
    const { creatorTonsCollected, wlTonsCollected, totalTonsCollected } = params;
    const c = client ?? globalClient;
    assert(Object.values(params).some(value => value !== undefined), "At least one parameter must be provided");
    logger().debug(`Updating launch balance with [${creatorTonsCollected}; ${wlTonsCollected}; ${totalTonsCollected}]`);

    const updateWith = (e: postgres.PendingQuery<postgres.Row[]>) =>
        c`UPDATE launch_balances
          SET ${e}
          WHERE token_launch = ${tokenLaunchAddress}
          RETURNING 1;`;
    // Execute separate updates for each parameter if they are provided
    if (creatorTonsCollected !== undefined) {
        const res = await updateWith(c`creator_tons_collected = ${creatorTonsCollected}`);
        if (res.length !== 1) logger().error(`creator_tons_collected for launch address ${tokenLaunchAddress} wasn't updated`);
    }
    if (wlTonsCollected !== undefined) {
        const res = await updateWith(c`wl_tons_collected = ${wlTonsCollected}`);
        if (res.length !== 1) logger().error(`wl_tons_collected for launch address ${tokenLaunchAddress} wasn't updated`);
    }
    if (totalTonsCollected !== undefined) {
        const res = await updateWith(c`total_tons_collected = ${totalTonsCollected}`);
        if (res.length !== 1) logger().error(`total_tons_collected for launch address ${tokenLaunchAddress} wasn't updated`);
    }
}