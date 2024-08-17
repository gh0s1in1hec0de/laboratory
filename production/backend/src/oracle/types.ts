import type { Coins, RawAddressString } from "../utils.ts";

export enum BalanceUpdateMode {
    WhitelistDeposit = 1,
    PublicDeposit = 2,
    WhitelistWithdrawal = 3,
    PublicWithdrawal = 4,
    TotalWithdrawal = 5
}

export enum UtilJettonsEnrollmentMode {
    UTIL_JET_REWARD_ENROLLMENT = 1,
    UTIL_JET_WL_PASS = 2
}

export type BalanceUpdateMessage = {
    mode: BalanceUpdateMode,
    tons: Coins,
    futureJettons: Coins,
}

export type RefundOrClaimConfirmationMessage = {
    whitelistTons: Coins,
    publicTons: Coins,
    futureJettons: Coins,
    recipient: RawAddressString
}