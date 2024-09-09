export type RawAddressString = string;
export type LamportTime = bigint;
export type Coins = bigint;

export const BASECHAIN = 0;
export const TRUE = -1n;
export const FALSE = 0n;
export const OP_LENGTH = 32;
export const QUERY_ID_LENGTH = 64;

export enum GlobalVersions {
    V1 = "V1",
    V2A = "V2A"
}

export enum CoreOps {
    // We'll use it for config parsing maybe
    Init = 0x18add407,
    InitCallback = 0x5d988a60,
    // Tracking new launches
    CreateLaunch = 0x0eedbf42,
    UpdateConfig = 0x3cacf836,
    Upgrade = 0x055d212a,
}

export enum TokensLaunchOps {
    Init = 0x358b2487,
    CreatorBuyout = 0x0a535100,
    PublicPurchase = 0x32626062,
    WlPurchase = 0x4eb1e316,
    WlCallback = 0x390f7cfd,
    RefundRequest = 0x7b4587a1,
    RefundConfirmation = 0x6f7dbcd0,
    JettonClaimRequest = 0x16b3aef0,
    JettonClaimConfirmation = 0x349c1c7f,
    DeployJetton = 0x71161970,
}

export enum UserVaultOps {
    balanceUpdate = 0x00399d7a,
    Claim = 0x556a6246,
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