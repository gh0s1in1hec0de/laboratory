import type { Sql } from "postgres";
import {
    type TokenLaunchTimings,
    type RawAddressString,
    type UnixTimeSeconds,
    type GlobalVersions,
    type TokenMetadata,
    BalanceUpdateMode,
    TokenLaunchFields,
    type LamportTime,
    type Coins,
    SortOrder,
} from "starton-periphery";

type SqlTypes = { bigint: bigint };
export type SqlClient = Sql<SqlTypes>;
// DB entities

export type StoredHeight = {
    contractAddress: RawAddressString,
    height: LamportTime,
}
export type TelegramId = string;
export type StoredUser = {
    invitedBy: TelegramId,
    telegramId: TelegramId,
    nickname: string | null,
}

export type Caller = {
    callerId: number,
    address: RawAddressString,
    ticket_balance: number,
}

export type StringifiedCoins = string;
export type PostDeployEnrollmentStats = {
    deployedJetton: { masterAddress: RawAddressString, ourWalletAddress: RawAddressString },
    totalTonsCollected: StringifiedCoins,
    oursAmount: StringifiedCoins,
    dexAmount: StringifiedCoins,
}

export type DexData = {
    jettonVaultAddress?: RawAddressString,
    poolAddress?: RawAddressString,
    addedLiquidity: boolean,
    payedToCreator: boolean,
}

export type StoredTokenLaunch = {
    id: number,
    identifier: string,

    address: RawAddressString,
    creator: RawAddressString,
    version: GlobalVersions,

    metadata: TokenMetadata,
    timings: TokenLaunchTimings,
    createdAt: UnixTimeSeconds,

    isSuccessful: boolean | null,
    postDeployEnrollmentStats: PostDeployEnrollmentStats | null,
    dexData: DexData | null,
};

export type LaunchBalances = {
    tokenLaunch: RawAddressString,
    creatorTonsCollected: Coins,
    wlTonsCollected: Coins,
    pubTonsCollected: Coins,
    totalTonsCollected: Coins,
}

export enum UserActionType {
    WhiteListBuy = "whitelist_buy",
    PublicBuy = "public_buy",
    WhitelistRefund = "whitelist_refund",
    PublicRefund = "public_refund",
    TotalRefund = "total_refund",
    Claim = "claim",
}

// Id is optional as we use the same type for recording and retrieving data
export type UserAction = {
    id?: bigint,
    actor: RawAddressString,
    tokenLaunch: RawAddressString,
    actionType: UserActionType,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
    lt: LamportTime,
    timestamp: UnixTimeSeconds,
    queryId: bigint,
};

export type StoredUserBalance = {
    caller: RawAddressString,
    tokenLaunch: RawAddressString,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
};

// Helpers and periphery
export const balanceUpdateModeToUserActionType: { [key in BalanceUpdateMode]: UserActionType } = {
    [BalanceUpdateMode.WhitelistDeposit]: UserActionType.WhiteListBuy,
    [BalanceUpdateMode.PublicDeposit]: UserActionType.PublicBuy,
    [BalanceUpdateMode.WhitelistWithdrawal]: UserActionType.WhitelistRefund,
    [BalanceUpdateMode.PublicWithdrawal]: UserActionType.PublicRefund,
    [BalanceUpdateMode.TotalWithdrawal]: UserActionType.TotalRefund,
};

export type StoredWhitelistRelations = {
    tokenLaunchAddress: string,
    callerAddress: string,
}

export type StoredTasksRelations = {
    callerAddress: string,
    taskId: number,
}

export interface StoredTokenLaunchRequest {
    page: number,
    limit: number,
    orderBy: TokenLaunchFields,
    order: SortOrder,
    search?: string,
}

export interface StoredTasksRequest {
    page: number,
    limit: number,
}

export interface StoredTokenLaunchResponse {
    storedTokenLaunch: StoredTokenLaunch[],
    hasMore: boolean,
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
