export type RawAddressString = string;
export type LamportTime = bigint;
export type Coins = bigint;

export const BASECHAIN = 0;
export const TRUE = -1n;
export const FALSE = 0n;
export const OP_LENGTH = 32;
export const QUERY_ID_LENGTH = 64;

export enum CoreOps {
    // We'll use it for config parsing maybe
    init = 0x18add407,
    initCallback = 0x5d988a60,
    // Tracking new launches
    createLaunch = 0x0eedbf42,
    upgrade = 0x055d212a,
}

export enum TokensLaunchOps {
    init = 0x358b2487,
    creatorBuyout = 0x0a535100,
    publicPurchase = 0x32626062,
    wlPurchase = 0x4eb1e316,
    // wlRequest = transfer_notification
    wlCallback = 0x390f7cfd,
    refundRequest = 0x7b4587a1,
    refundConfirmation = 0x6f7dbcd0,
    jettonClaimRequest = 0x16b3aef0,
    jettonClaimConfirmation = 0x349c1c7f,
    deployJetton = 0x71161970,
}

export enum UserVaultOps {
    balanceUpdate = 0x00399d7a,
    claim = 0x556a6246,
}

export type WithdrawConfirmationMessage = {
    whitelistTons: Coins,
    publicTons: Coins,
    futureJettons: Coins,
    recipient: RawAddressString,
    mode?: BalanceUpdateMode,
};

export enum BalanceUpdateMode {
    WhitelistDeposit = 1,
    PublicDeposit = 2,
    WhitelistWithdrawal = 3,
    PublicWithdrawal = 4,
    TotalWithdrawal = 5
}

export const UTIL_JET_SEND_MODE_SIZE = 4;
export enum UtilJettonsEnrollmentMode {
    UtilJettonRewardEnrollment = 1,
    UtilJettonWlPass = 2
}

export type BalanceUpdateMessage = {
    mode: BalanceUpdateMode,
    tons: Coins,
    futureJettons: Coins,
};

// Extend with https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md
export type TokenMetadata = {
    uri: string
};