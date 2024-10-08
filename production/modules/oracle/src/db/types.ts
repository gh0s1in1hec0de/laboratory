import type { Sql } from "postgres";
import {
    type StoredTokenLaunch,
    TokenLaunchFields,
    SortOrder,
} from "starton-periphery";

type SqlTypes = { bigint: bigint };
export type SqlClient = Sql<SqlTypes>;

// DB entities

export interface StoredTokenLaunchRequest {
    page: number,
    limit: number,
    orderBy: TokenLaunchFields,
    order: SortOrder,
    search?: string,
}

export interface StoredTokenLaunchResponse {
    storedTokenLaunch: StoredTokenLaunch[],
    hasMore: boolean,
}