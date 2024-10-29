import { Address } from "@ton/core";

export type RawAddressString = string;
export type LamportTime = bigint;
export type Coins = bigint;

export const TESTNET_FACTORY_ADDR = Address.parse("EQAROb_l-1yGMKjPGUmc0tNjYOsXTKTsucXmhh2Fm9y98z7Y");
export const BURN_ADDR = Address.parse("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c");
export const DEFAULT_SUB_WALLET = 698983191;

export const BASECHAIN = 0;
export const TRUE = -1n;
export const FALSE = 0n;
export const OP_LENGTH = 32;
export const QUERY_ID_LENGTH = 64;

export enum GlobalVersions {
    // Ticket-based
    V1 = "V1",
    // Utility jetton-based
    V2 = "V2"
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
    CreatorRefund = 0x4d542b8a,
    PublicPurchase = 0x32626062,
    WhitelistPurchase = 0x4eb1e316,
    WlCallback = 0x390f7cfd,
    RefundRequest = 0x7b4587a1,
    RefundConfirmation = 0x6f7dbcd0,
    JettonClaimRequest = 0x16b3aef0,
    JettonClaimConfirmation = 0x349c1c7f,
    DeployJetton = 0x71161970,
    ClaimOpn = 0x50c5723e
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
export type OnchainMetadataStandard = {
    uri: string
};

export enum JettonOps {
    Transfer = 0xf8a7ea5,
    TransferNotification = 0x7362d09c,
    InternalTransfer = 0x178d4519,
    Excesses = 0xd53276db,
    Burn = 0x595f07bc,
    BurnNotification = 0x7bdd97de,

    ProvideWalletAddress = 0x2c76b973,
    TakeWalletAddress = 0xd1735400,
    Mint = 0x642b7d07,
    ChangeAdmin = 0x6501f354,
    RevokeAdmin = 0x471ffff3,
    Upgrade = 0x2508d66a,
    CallTo = 0x235caf52,
    TopUp = 0xd372158c,
    ChangeMetadataUrl = 0xcb862902,
    SetStatus = 0xeed236d3,
}