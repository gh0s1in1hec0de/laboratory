import type { LaunchBalance, LaunchMetadata, StoredTokenLaunch } from "./Database";
import { LaunchSortParameters, SortingOrder, } from "./utils";
import type { RawAddressString } from "./standards";
import { t } from "elysia";

export type StoredTokenLaunchRequest = {
    page: number,
    limit: number,
    orderBy: LaunchSortParameters,
    order: SortingOrder,
    succeed?: boolean,
    createdBy?: RawAddressString,
    search?: string,
}

export type ExtendedLaunch = StoredTokenLaunch & LaunchBalance & { activeHolders: number };
export type StoredTokenLaunchResponse = {
    launchesChunk: ExtendedLaunch[],
    hasMore: boolean,
}

export type CertainLaunchRequest = {
    address?: RawAddressString,
    metadataUri?: string
}
export type ExtendedLaunchWithMetadata = ExtendedLaunch & { offchainMetadata: LaunchMetadata }

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