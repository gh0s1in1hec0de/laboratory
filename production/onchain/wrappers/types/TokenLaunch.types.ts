import {Address, Cell} from "@ton/core";

export type SaleConfigParams = {
  futJetTotalSupply: bigint,
  futJetDexAmount: bigint,
  futJetPlatformAmount: bigint,
  rewardUtilJetsTotalAmount: bigint,
}

export type GeneralStateParams = {
  startTime: number,
  futJetInnerBalance: bigint,
  futJetDeployedBalance: bigint,
  totalTonsCollected: bigint,
  rewardUtilJetsBalance: bigint,
}

export type CreatorRoundStateParams = {
  futJetLimit: bigint,
  creatorFutJetBalance: bigint,
  futJetPrice: bigint,
  endTime: number,
}

export type WlRoundStateParams = {
  futJetLimit: bigint,
  tonLimit: bigint,
  passUtilJetAmount: bigint,
  burnUtilJetAmount: bigint,
  tonInvestedTotal: bigint,
  endTime: number,
}

export type PublicRoundStateParams = {
  futJetLimit: bigint,
  futJetSold: bigint,
  syntheticJetReserve: bigint,
  syntheticTonReserve: bigint,
  endTime: number,
};

export type SaleStateParams = {
  generalState: GeneralStateParams,
  creatorRoundState: CreatorRoundStateParams,
  wlRoundState: WlRoundStateParams,
  publicRoundState: PublicRoundStateParams,
}

export type ToolsParams = {
  utilJetWalletAddress: Address,
  futJetMasterAddress: Address,
  futJetWalletAddress: Address,
  metadata: Cell,
  futJetMasterCode: Cell,
  walletCode: Cell,
  userVaultCode: Cell,
}

export type TokenLaunchConfig = {
  isInitialized: boolean,
  operationalNeeds: bigint,
  chiefAddress: Address;
  creatorAddress: Address;
  saleConfig: SaleConfigParams,
  saleState: SaleStateParams,
  tools: ToolsParams,
}

export type RefundRequestParams = {
  mode: number,
  refundValue: bigint | number,
}

export type LaunchDataType = {
  futJetTotalSupply: bigint,
  creatorAddress: Address,
  metadata: Cell,
}

export type SaleStateType = {
  rewardUtilJetsBalance: bigint,
  generalStateStartTime: bigint,
  creatorRoundEndTime: bigint,
  wlRoundEndTime: bigint,
  publicRoundEndTime: bigint,
  totalTonsCollected: bigint,
  futJetDeployedBalance: bigint,
}