import { Address, Cell } from "@ton/core";
import { Coins } from "./standards";

// Unified standards and parts for Cores and Token Launches
export type Contracts = {
    tokenLaunch: Cell,
    userVault: Cell,
    jettonMaster: Cell,
    jettonWallet: Cell,
}

// Token Launches' unified getters
export type SaleMoneyFlow = {
    totalTonsCollected: Coins,
    creatorFutJetBalance: Coins,
    wlRoundTonInvestedTotal: Coins,
    publicRoundFutJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
}
export type TokenLaunchTimings = {
    startTime: Date,
    creatorRoundEndTime: Date,
    wlRoundEndTime: Date,
    publicRoundEndTime: Date,
    endTime: Date,
};
export type LaunchData = {
    futJetTotalSupply: Coins,
    creatorAddress: Address,
    metadata: Cell,
};