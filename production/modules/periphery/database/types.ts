import { BalanceUpdateMode, Coins, GlobalVersions, LamportTime, RawAddressString, TokenMetadata } from "../standards";
import type { TokenLaunchTimings } from "../types";
import type { UnixTimeSeconds } from "../utils";
import { JettonMetadata } from "../metadata";

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
    totalSupply: Coins,
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
    id: bigint,
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

export type UserClaim = {
    id: bigint,
    tokenLaunch: RawAddressString,
    actor: RawAddressString,
    jettonAmount: Coins,
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

// Dispenser
export type RewardJetton = {
    masterAddress: RawAddressString,
    metadata: JettonMetadata,
    currentBalance: Coins,
    rewardAmount: Coins,
};

export type RewardPool = {
    tokenLaunch: RawAddressString,
    rewardJetton: RawAddressString,
    rewardAmount: Coins,
};

export enum UserLaunchRewardStatus {
    Unclaimed = "unclaimed",
    Claimed = "claimed",
}

export type UserLaunchRewardPosition = {
    user: RawAddressString,
    tokenLaunch: RawAddressString,
    rewardJetton: RawAddressString,
    userClaim: bigint,
    balance: Coins,
    status: UserLaunchRewardStatus,
};

export type UserRewardJettonBalance = {
    user: RawAddressString,
    rewardJetton: RawAddressString,
    balance: Coins,
};