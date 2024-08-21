import { Address, Cell } from "@ton/core";
import { Coins } from "./general";

// Getters
export type TokenLaunchTimings = {
    startTime: Date,
    creatorRoundTime: Date,
    wlRoundTime: Date,
    publicRoundTime: Date,
    endTime: Date,
};

export type SaleMoneyFlow = {
    creatorFutJEtBalance: Coins,
    tonInvestedTotal: Coins,
    futJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
}

export type LaunchData = {
    futJetTotalSupply: Coins,
    creatorAddress: Address,
    metadata: Cell,
};


// Storage
export type GeneralState = {
    startTime: number,
    futJetInnerBalance: Coins,
    futJetDeployedBalance: Coins,
    totalTonsCollected: Coins,
    rewardUtilJetsBalance: Coins,
    endTime: number,
};

export type CreatorRoundState = {
    futJetLimit: Coins,
    futJetBalance: Coins,
    creatorFutJetPrice: Coins,
    endTime: number,
};

export type WhitelistRoundState = {
    futJetLimit: Coins,
    tonLimit: Coins,
    wlPassUtilJetAmount: Coins,
    wlBurnUtilJetAmount: Coins,
    tonInvestedTotal: Coins,
    endTime: number,
};

export type PublicRoundState = {
    futJetLimit: Coins,
    futJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
    endTime: number,
};

export type SaleState = {
    general: GeneralState,
    creatorRound: CreatorRoundState,
    wlRound: WhitelistRoundState,
    pubRound: PublicRoundState,
};

export type Tools = {
    utilJetWalletAddress: Address,
    futJetMasterAddress: Address,
    futJetWalletAddress: Address,
    metadata: Cell,
    futJetMasterCode: Cell,
    walletCode: Cell,
    userVaultCode: Cell,
};

export type SaleConfig = {
    futJetTotalSupply: Coins,
    minTonForSaleSuccess: Coins,
    futJetDexAmount: Coins,
    futJetPlatformAmount: Coins,
    rewardUtilJetsTotalAmount: Coins,
};

export type TokenLaunchStorage = {
    isInitialized: boolean,
    operationalNeeds: Coins,
    chiefAddress: Address,
    creatorAddress: Address,
    saleConfig: SaleConfig,
    saleState: SaleState,
    tools: Tools,
};