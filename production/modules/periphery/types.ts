import { Address, Cell } from "@ton/core";
import { Coins } from "./standards";
import { UnixTimeSeconds } from "./utils";

// Unified standards and parts for Cores and Token Launches
export type Contracts = {
    tokenLaunch: Cell,
    userVault: Cell,
    jettonMaster: Cell,
    jettonWallet: Cell,
}

// Token Launches' unified getters
export type MoneyFlows = {
    totalTonsCollected: Coins,
    creatorFutJetBalance: Coins,
    wlRoundTonInvestedTotal: Coins,
    publicRoundFutJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
}
export type TokenLaunchTimings = {
    startTime: UnixTimeSeconds,
    creatorRoundEndTime: UnixTimeSeconds,
    wlRoundEndTime: UnixTimeSeconds,
    publicRoundEndTime: UnixTimeSeconds,
    endTime: UnixTimeSeconds,
};
export type LaunchData = {
    futJetTotalSupply: Coins,
    creatorAddress: Address,
    metadata: Cell,
};
// Shitty name to avoid naming collisions
export type GetConfigResponse = {
    creatorFutJetBalance: Coins,
    creatorFutJetLeft: Coins,
    creatorFutJetPriceReversed: Coins,
    wlRoundFutJetLimit: Coins,
    wlRoundTonLimit: Coins,
    pubRoundFutJetLimit: Coins,
    futJetDexAmount: Coins,
    futJetPlatformAmount: Coins,
    minTonForSaleSuccess: Coins
}