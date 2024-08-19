import type { Coins, LamportTime, RawAddressString } from "../utils";
import type { Sql } from "postgres";

type SqlTypes = { bigint: bigint };
export type SqlClient = Sql<SqlTypes>;

export type StoredHeight = {
    contractAddress: RawAddressString;
    height: LamportTime;
}
export type StoredUser = {
    address: RawAddressString;
    nickname: string | null;
};

// TODO Change this type
//      ... when the time comes...
export type JsonLaunchMetadata = {
    url: string;
};

export type StoredTokenLaunch = {
    address: RawAddressString;
    creator: RawAddressString;
    metadata: JsonLaunchMetadata;
    creatorBalance: Coins;
    startTime: Date;
    endTime: Date;
};

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
    id?: bigint;
    actor: RawAddressString;
    tokenLaunch: RawAddressString;
    actionType: UserActionType;
    whitelistTons: Coins;
    publicTons: Coins;
    jettons: Coins;
    timestamp: Date;
    queryId: bigint;
};

export type StoredUserBalance = {
    actor: RawAddressString;
    tokenLaunch: RawAddressString;
    whitelistTons: Coins;
    publicTons: Coins;
    jettons: Coins;
};