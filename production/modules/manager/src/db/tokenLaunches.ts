import type { SqlClient, } from "./types";
import { globalClient } from "./db";
import {
    type GetLaunchesChunkRequest,
    type StoredTokenLaunch,
    LaunchSortParameters,
    type LaunchMetadata
} from "starton-periphery";

export async function getSortedTokenLaunches(
    { page, limit, orderBy, order, succeed, createdBy, search }: GetLaunchesChunkRequest, client?: SqlClient
): Promise<{ launchesChunk: (StoredTokenLaunch & Partial<LaunchMetadata>)[], hasMore: boolean } | null> {
    const offset = (page - 1) * limit;
    const c = client ?? globalClient;
    const orderByExpression = {
        [LaunchSortParameters.CREATED_AT]: c.unsafe(`tl.${orderBy} ${order}`),
        [LaunchSortParameters.TOTAL_TONS_COLLECTED]: c.unsafe(`lb.${orderBy} ${order}`),
    }[orderBy];

    const res = await c<(StoredTokenLaunch & Partial<LaunchMetadata>)[]>`
        SELECT tl.*, lm.*
        FROM token_launches tl
                 LEFT JOIN launch_metadata lm ON (tl.metadata ->> 'uri')::TEXT = lm.onchain_metadata_link
        WHERE tl.identifier ILIKE ${`%${search ?? ""}%`}
            ${succeed !== undefined ? c`AND tl.is_successful = ${succeed}` : c``}
            ${createdBy ? c`AND tl.creator = ${createdBy}` : c``}
        ORDER BY tl.platform_share DESC, ${orderByExpression}
        LIMIT ${limit + 1} OFFSET ${offset};
    `;
    return !res.length ? null : {
        launchesChunk: res.slice(0, limit),
        hasMore: res.length > limit
    };
}
