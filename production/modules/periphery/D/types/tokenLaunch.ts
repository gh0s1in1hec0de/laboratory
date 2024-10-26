import { Address, Cell } from "@ton/core";
import { Coins } from "../../standards";

// Storage
export type GeneralStateDeprecated = {
    startTime: number,
    futJetInnerBalance: Coins,
    futJetDeployedBalance: Coins,
    totalTonsCollected: Coins,
    rewardUtilJetsBalance: Coins,
};

export type CreatorRoundStateDeprecated = {
    futJetLeft: Coins,
    futJetBalance: Coins,
    creatorFutJetPrice: Coins,
    endTime: number,
};

export type WhitelistRoundStateDeprecated = {
    futJetLimit: Coins,
    tonLimit: Coins,
    wlPassUtilJetAmount: Coins,
    wlBurnUtilJetAmount: Coins,
    tonInvestedTotal: Coins,
    endTime: number,
};

export type PublicRoundStateDeprecated = {
    futJetLimit: Coins,
    futJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
    endTime: number,
};

export type SaleStateDeprecated = {
    general: GeneralStateDeprecated,
    creatorRound: CreatorRoundStateDeprecated,
    wlRound: WhitelistRoundStateDeprecated,
    pubRound: PublicRoundStateDeprecated,
};

export type ToolsDeprecated = {
    utilJetWalletAddress: Address,
    futJetMasterAddress: Address,
    futJetWalletAddress: Address,
    metadata: Cell,
    futJetMasterCode: Cell,
    walletCode: Cell,
    userVaultCode: Cell,
};

export type SaleConfigDeprecated = {
    futJetTotalSupply: Coins,
    minTonForSaleSuccess: Coins,
    futJetDexAmount: Coins,
    futJetPlatformAmount: Coins,
    rewardUtilJetsTotalAmount: Coins,
};

export type DeprecatedTokenLaunchStorage = {
    isInitialized: boolean,
    operationalNeeds: Coins,
    chiefAddress: Address,
    creatorAddress: Address,
    saleConfig: SaleConfigDeprecated,
    saleState: SaleStateDeprecated,
    tools: ToolsDeprecated,
};