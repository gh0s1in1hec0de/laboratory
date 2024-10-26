import { Maybe } from "@ton/ton/dist/utils/maybe";
import { Address, Cell } from "@ton/core";
import { Coins } from "../../standards";

// Storage
export type GeneralStateV2 = {
    startTime: number,
    futJetInnerBalance: Coins,
    futJetDeployedBalance: Coins,
    totalTonsCollected: Coins,
};

export type CreatorRoundStateV2 = {
    futJetLeft: Coins,
    futJetBalance: Coins,
    creatorFutJetPrice: Coins,
    endTime: number,
};

export type WhitelistRoundStateV2 = {
    futJetLimit: Coins,
    tonLimit: Coins,
    utilJetWlPassAmount: Coins,
    utilJetWlPassOneTimePriceAmount: Coins,
    tonInvestedTotal: Coins,
    endTime: number,
};

export type PublicRoundStateV2 = {
    futJetLimit: Coins,
    futJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
    endTime: number,
};

export type SaleStateV2 = {
    general: GeneralStateV2,
    creatorRound: CreatorRoundStateV2,
    wlRound: WhitelistRoundStateV2,
    pubRound: PublicRoundStateV2,
};

export type ToolsV2 = {
    futJetMasterAddress: Maybe<Address>,
    futJetWalletAddress: Maybe<Address>,
    utilJetWalletAddress: Maybe<Address>,
    metadata: Cell,
    futJetMasterCode: Cell,
    walletCode: Cell,
    userVaultCode: Cell,
};

export type SaleConfigV2 = {
    futJetTotalSupply: Coins,
    minTonForSaleSuccess: Coins,
    futJetDexAmount: Coins,
    futJetPlatformAmount: Coins,
};

export type TokenLaunchStorageV2 = {
    isInitialized: boolean,
    operationalNeeds: Coins,
    chiefAddress: Address,
    creatorAddress: Address,
    saleConfig: SaleConfigV2,
    saleState: SaleStateV2,
    tools: ToolsV2,
};