import { Address, Cell } from "@ton/core";
import { Coins } from "../../standards";

// Storage
export type GeneralStateV1 = {
    startTime: number,
    futJetInnerBalance: Coins,
    futJetDeployedBalance: Coins,
    totalTonsCollected: Coins,
    rewardUtilJetsBalance: Coins,
};

export type CreatorRoundStateV1 = {
    futJetLimit: Coins,
    futJetBalance: Coins,
    creatorFutJetPrice: Coins,
    endTime: number,
};

export type WhitelistRoundStateV1 = {
    futJetLimit: Coins,
    tonLimit: Coins,
    wlPassUtilJetAmount: Coins,
    wlBurnUtilJetAmount: Coins,
    tonInvestedTotal: Coins,
    endTime: number,
};

export type PublicRoundStateV1 = {
    futJetLimit: Coins,
    futJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
    endTime: number,
};

export type SaleStateV1 = {
    general: GeneralStateV1,
    creatorRound: CreatorRoundStateV1,
    wlRound: WhitelistRoundStateV1,
    pubRound: PublicRoundStateV1,
};

export type ToolsV1 = {
    utilJetWalletAddress: Address,
    futJetMasterAddress: Address,
    futJetWalletAddress: Address,
    metadata: Cell,
    futJetMasterCode: Cell,
    walletCode: Cell,
    userVaultCode: Cell,
};

export type SaleConfigV1 = {
    futJetTotalSupply: Coins,
    minTonForSaleSuccess: Coins,
    futJetDexAmount: Coins,
    futJetPlatformAmount: Coins,
    rewardUtilJetsTotalAmount: Coins,
};

export type TokenLaunchStorageV1 = {
    isInitialized: boolean,
    operationalNeeds: Coins,
    chiefAddress: Address,
    creatorAddress: Address,
    saleConfig: SaleConfigV1,
    saleState: SaleStateV1,
    tools: ToolsV1,
};