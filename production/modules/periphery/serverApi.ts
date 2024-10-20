import type { LaunchBalance, StoredTokenLaunch } from "./Database";
import { LaunchSortParameters, SortingOrder, type UnixTimeSeconds } from "./utils";
import type { RawAddressString } from "./standards";

export type StoredTokenLaunchRequest = {
    page: number,
    limit: number,
    orderBy: LaunchSortParameters,
    order: SortingOrder,
    succeed?: boolean,
    search?: string,
}

export type StoredTokenLaunchResponse = {
    launchesChunk: (StoredTokenLaunch & LaunchBalance & { activeHolders: number })[],
    hasMore: boolean,
}

export type ConnectedWalletRequest = {
    address: RawAddressString,
    referral?: string,
}


export type StoredTasksRequest = {
    page: number,
    limit: number,
}

export type TicketBalanceRequest = {
    address: RawAddressString,
}

export type TasksRequest = {
    address?: RawAddressString,
    staged: string,
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