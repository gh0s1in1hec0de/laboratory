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
export type StoredTokenLaunchRequest = {
    page: number,
    limit: number,
    orderBy: TokenLaunchFields,
    order: SortOrder,
    search?: string,
}

export type StoredTokenLaunchResponse = {
    storedTokenLaunch: StoredTokenLaunch[],
    hasMore: boolean,
}

export type StoredTasksRequest = {
    page: number,
    limit: number,
}

export type ConnectedWalletRequest = {
    address: RawAddressString,
    referral?: string,
}

export type TicketBalanceRequest = {
    address: RawAddressString,
}

export type TasksRequest = {
    address?: RawAddressString,
    staged: string,
}

export type SortedTasksRequest = {
    page: number,
    limit: number,
}

export type SortedTasks = {
    storedTasks: StoredTasks[],
    hasMore: boolean,
}

export type StoredTasks = {
    taskId: number,
    name: string,
    description: string,
    rewardTickets: number,
    createdAt: UnixTimeSeconds,
}

export type StoredUsersTasksRelations = {
    callerAddress: RawAddressString,
    taskId: number,
}

export type Subtask = {
    name: string,
    description: string,
}

export type TasksResponse = {
    taskId: number,
    name: string,
    description: Subtask[],
    rewardTickets: number,
    createdAt: number,
    completed: boolean,
}
