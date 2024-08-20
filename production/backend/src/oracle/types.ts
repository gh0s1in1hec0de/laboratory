import type { Coins, RawAddressString } from "../utils";
import { UserActionType } from "../db";

export enum BalanceUpdateMode {
    WhitelistDeposit = 1,
    PublicDeposit = 2,
    WhitelistWithdrawal = 3,
    PublicWithdrawal = 4,
    TotalWithdrawal = 5
}

export const balanceUpdateModeToUserActionType: { [key in BalanceUpdateMode]: UserActionType } = {
    [BalanceUpdateMode.WhitelistDeposit]: UserActionType.WhiteListBuy,
    [BalanceUpdateMode.PublicDeposit]: UserActionType.PublicBuy,
    [BalanceUpdateMode.WhitelistWithdrawal]: UserActionType.WhitelistRefund,
    [BalanceUpdateMode.PublicWithdrawal]: UserActionType.PublicRefund,
    [BalanceUpdateMode.TotalWithdrawal]: UserActionType.TotalRefund,
};

export enum UtilJettonsEnrollmentMode {
    UtilJettonRewardEnrollment = 1,
    UtilJettonWlPass = 2
}

export type BalanceUpdateMessage = {
    mode: BalanceUpdateMode,
    tons: Coins,
    futureJettons: Coins,
};

export type WithdrawConfirmationMessage = {
    whitelistTons: Coins,
    publicTons: Coins,
    futureJettons: Coins,
    recipient: RawAddressString,
    mode?: BalanceUpdateMode,
};