import type {Sql} from "postgres";

type SqlTypes = { bigint: bigint };
export type Client = Sql<SqlTypes>;
// Just for readability
export type Address = string;
export type Coins = bigint;

export type StoredUser = {
    address: Address,
    nickname: string | null
};

// TODO Change this type
export type JsonLaunchMetadata = {
    url: string;
};

export type StoredTokenLaunch = {
    address: Address,
    creator: Address,
    metadata: JsonLaunchMetadata
    creatorBalance: Coins
};

export enum UserActionType {
    WhiteListBuy = "whitelist_buy",
    PublicBuy = "public_buy",
    WhitelistRefund = "whitelist_refund",
    PublicRefund = "public_refund",
    TotalRefund = "total_refund",
    Claim = "claim",
}

export type UserAction = {
    actor: Address,
    tokenLaunch: Address,
    actionType: UserActionType,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
    timestamp: Date
};

export type StoredUserBalance = {
    actor: Address,
    tokenLaunch: Address,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
};