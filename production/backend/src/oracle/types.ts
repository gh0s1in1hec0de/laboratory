import type { Coins, RawAddressString } from "../utils";
import { UserActionType } from "../db";

export enum BalanceUpdateMode {
    WhitelistDeposit = 1,
    PublicDeposit = 2,
    WhitelistWithdrawal = 3,
    PublicWithdrawal = 4,
    TotalWithdrawal = 5
}

export function balanceUpdateModeToUserAction(mode: BalanceUpdateMode) {
    switch (mode) {
    case BalanceUpdateMode.WhitelistDeposit:
        return UserActionType.WhiteListBuy;
    case BalanceUpdateMode.PublicDeposit:
        return UserActionType.PublicBuy;
    case BalanceUpdateMode.WhitelistWithdrawal:
        return UserActionType.WhitelistRefund;
    case BalanceUpdateMode.PublicWithdrawal:
        return UserActionType.PublicRefund;
    case BalanceUpdateMode.TotalWithdrawal:
        return UserActionType.TotalRefund;
    }
}

export enum UtilJettonsEnrollmentMode {
    UtilJettonRewardEnrollment = 1,
    UtilJettonWlPass = 2
}

export type BalanceUpdateMessage = {
    mode: BalanceUpdateMode;
    tons: Coins;
    futureJettons: Coins;
}

export type RefundOrClaimConfirmationMessage = {
    whitelistTons: Coins;
    publicTons: Coins;
    futureJettons: Coins;
    recipient: RawAddressString;
}