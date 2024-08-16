import type {Sql} from "postgres";
import type {Coins} from "../utils.ts";

type SqlTypes = { bigint: bigint };
export type Client = Sql<SqlTypes>;
// Just for readability
export type StoredAddress = string;

export type StoredUser = {
    address: StoredAddress,
    nickname: string | null
};

// TODO Change this type
export type JsonLaunchMetadata = {
    url: string;
};

export type StoredTokenLaunch = {
    address: StoredAddress,
    creator: StoredAddress,
    metadata: JsonLaunchMetadata
    creatorBalance: Coins
    startTime: Date,
    endTime: Date,
    height: Date,
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
    actor: StoredAddress,
    tokenLaunch: StoredAddress,
    actionType: UserActionType,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
    timestamp: Date
};

export type StoredUserBalance = {
    actor: StoredAddress,
    tokenLaunch: StoredAddress,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
};