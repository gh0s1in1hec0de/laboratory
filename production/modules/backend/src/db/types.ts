import type { Sql } from "postgres";
import {
    type TokenLaunchTimings,
    type RawAddressString,
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
    user: TelegramId | null,
    address: RawAddressString,
}

export type PostDeployEnrollmentStats = {
    deployedJetton: { masterAddress: RawAddressString, ourWalletAddress: RawAddressString },
    totalTonsCollected: Coins,
    oursAmount: Coins,
    dexAmount: Coins,
}

export type DexData = {
    jettonVaultAddress: RawAddressString,
    poolAddress: RawAddressString,
    addedLiquidity: boolean,
}

export type StoredTokenLaunch = {
    id: number,
    identifier: string,

    address: RawAddressString,
    creator: RawAddressString,
    version: GlobalVersions,

    metadata: TokenMetadata,
    timings: TokenLaunchTimings,
    createdAt: Date,

    isSuccessful: boolean | null,
    postDeployEnrollmentStats: PostDeployEnrollmentStats | null,
    dexData: DexData | null,
};

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
    timestamp: Date,
    queryId: bigint,
};

export type StoredUserBalance = {
    caller: RawAddressString,
    tokenLaunch: RawAddressString,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
};

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
