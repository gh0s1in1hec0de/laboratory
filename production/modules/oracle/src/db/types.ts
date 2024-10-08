import type { Sql } from "postgres";
import {
    type StoredTokenLaunch,
    type RawAddressString,
    type UnixTimeSeconds,
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

export interface StoredTasksRequest {
    page: number,
    limit: number,
}

export interface ConnectedWalletRequest {
    address: RawAddressString,
    referral?: string,
}

export interface TicketBalanceRequest {
    address: RawAddressString,
}

export interface TasksRequest {
    address?: RawAddressString,
    staged: string,
}

export interface SortedTasksRequest {
    page: number,
    limit: number,
}

export interface SortedTasks {
    storedTasks: StoredTasks[],
    hasMore: boolean,
}

export interface StoredTasks {
    taskId: number,
    name: string,
    description: string,
    rewardTickets: number,
    createdAt: UnixTimeSeconds,
}

export interface StoredUsersTasksRelations {
    callerAddress: RawAddressString,
    taskId: number,
}

export interface Subtask {
    name: string,
    description: string,
}

export interface TasksResponse {
    taskId: number,
    name: string,
    description: Subtask[],
    rewardTickets: number,
    createdAt: number,
    completed: boolean,
}
