import { Address, Cell } from "@ton/core";
import { Coins } from "../../standards";

// Storage
export type GeneralStateV2A = {
    startTime: number,
    futJetInnerBalance: Coins,
    futJetDeployedBalance: Coins,
    totalTonsCollected: Coins,
};

export type CreatorRoundStateV2A = {
    futJetLeft: Coins,
    futJetBalance: Coins,
    creatorFutJetPrice: Coins,
    endTime: number,
};

export type WhitelistRoundStateV2A = {
    futJetLimit: Coins,
    tonLimit: Coins,
    tonInvestedTotal: Coins,
    endTime: number,
};

export type PublicRoundStateV2A = {
    futJetLimit: Coins,
    futJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
    endTime: number,
};

export type SaleStateV2A = {
    general: GeneralStateV2A,
    creatorRound: CreatorRoundStateV2A,
    wlRound: WhitelistRoundStateV2A,
    pubRound: PublicRoundStateV2A,
};

export type ToolsV2A = {
    futJetMasterAddress: Address,
    futJetWalletAddress: Address,
    metadata: Cell,
    futJetMasterCode: Cell,
    walletCode: Cell,
    userVaultCode: Cell,
};

export type SaleConfigV2A = {
    futJetTotalSupply: Coins,
    minTonForSaleSuccess: Coins,
    futJetDexAmount: Coins,
    futJetPlatformAmount: Coins,
};

export type TokenLaunchStorageV2A = {
    isInitialized: boolean,
    operationalNeeds: Coins,
    chiefAddress: Address,
    creatorAddress: Address,
    saleConfig: SaleConfigV2A,
    saleState: SaleStateV2A,
    tools: ToolsV2A,
};