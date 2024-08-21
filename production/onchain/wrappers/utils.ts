import {beginCell, Cell, Sender} from "@ton/core";
import {
  CoreConfig,
  CreatorRoundStateParams,
  GeneralStateParams,
  PublicRoundStateParams,
  SaleConfigParams,
  SaleStateParams,
  TokenLaunchStorage,
  ToolsParams,
  WlRoundStateParams
} from "./types";


/* COMMON */

export type SendMessageParams = {
  via: Sender,
  value: bigint,
  queryId: bigint
}

export enum CoreOps {
  init = 0x18add407,
  create_launch = 0x0eedbf42,
  transfer_notification = 0x7362d09c,
  upgrade = 0x055d212a,
}

export enum TokensLaunchOps {
  public_buy = 0x16ee6c2d,
  refund_request = 0x7b4587a1,
  deploy_jet = 0x71161970,
  jetton_claim_request = 0x16b3aef0,
}

export enum Errors {}

// Extend with https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md
export type TEP64JettonMetadata = {
  uri: string
};

export function TEP64MetadataToCell(content: TEP64JettonMetadata): Cell {
  return beginCell()
    .storeStringRefTail(content.uri) //Snake logic under the hood
    .endCell();
}


/* CORE */

export function coreConfigToCell(config: CoreConfig): Cell {
  const contractsCell = beginCell()
    .storeRef(config.contracts.jettonLaunch)
    .storeRef(config.contracts.jettonLaunchUserVault)
    .storeRef(config.contracts.derivedJettonMaster)
    .storeRef(config.contracts.jettonWallet)
    .endCell();

  const launchConfigCell = beginCell()
    .storeCoins(config.launchConfig.minTonForSaleSuccess)
    .storeCoins(config.launchConfig.tonLimitForWlRound)
    .storeCoins(config.launchConfig.utilJetRewardAmount)
    .storeCoins(config.launchConfig.utilJetWlPassAmount)
    .storeCoins(config.launchConfig.utilJetBurnPerWlPassAmount)
    .storeUint(config.launchConfig.jetWlLimitPct, 16)
    .storeUint(config.launchConfig.jetPubLimitPct, 16)
    .storeUint(config.launchConfig.jetDexSharePct, 16)
    .storeInt(config.launchConfig.creatorRoundDurationMs, 32)
    .storeInt(config.launchConfig.wlRoundDurationMs, 32)
    .storeInt(config.launchConfig.pubRoundDurationMs, 32)
    .endCell();

  return beginCell()
    .storeAddress(config.chief)
    .storeAddress(config.utilJettonMasterAddress)
    .storeAddress(config.utilJettonWalletAddress)
    .storeCoins(config.utilJetCurBalance)
    .storeDict(config.notFundedLaunches)
    .storeUint(config.notFundedLaunchesAmount, 8)
    .storeRef(launchConfigCell)
    .storeRef(contractsCell)
    .endCell();
}


/* TOKEN LAUNCH */

function packageSaleConfigInCell(saleConfig: SaleConfigParams) {
  return beginCell()
    .storeCoins(saleConfig.futJetTotalSupply)
    .storeCoins(saleConfig.futJetDexAmount)
    .storeCoins(saleConfig.futJetPlatformAmount)
    .storeCoins(saleConfig.rewardUtilJetsTotalAmount)
    .endCell();
}

function packageGeneralStateInCell(generalState: GeneralStateParams) {
  return beginCell()
    .storeInt(generalState.startTime, 32)
    .storeCoins(generalState.futJetInnerBalance)
    .storeCoins(generalState.futJetDeployedBalance)
    .storeCoins(generalState.totalTonsCollected)
    .storeCoins(generalState.rewardUtilJetsBalance)
    .endCell();
}

function packageCreatorRoundStateInCell(creatorRoundState: CreatorRoundStateParams) {
  return beginCell()
    .storeCoins(creatorRoundState.futJetLimit)
    .storeCoins(creatorRoundState.creatorFutJetBalance)
    .storeCoins(creatorRoundState.futJetPrice)
    .storeInt(creatorRoundState.endTime, 32)
    .endCell();
}

function packageWlRoundStateInCell(wlRoundState: WlRoundStateParams) {
  return beginCell()
    .storeCoins(wlRoundState.futJetLimit)
    .storeCoins(wlRoundState.tonLimit)
    .storeCoins(wlRoundState.passUtilJetAmount)
    .storeCoins(wlRoundState.burnUtilJetAmount)
    .storeCoins(wlRoundState.tonInvestedTotal)
    .storeInt(wlRoundState.endTime, 32)
    .endCell();
}

function packagePublicRoundStateInCell(publicRoundState: PublicRoundStateParams) {
  return beginCell()
    .storeCoins(publicRoundState.futJetLimit)
    .storeCoins(publicRoundState.futJetSold)
    .storeCoins(publicRoundState.syntheticJetReserve)
    .storeCoins(publicRoundState.syntheticTonReserve)
    .storeInt(publicRoundState.endTime, 32)
    .endCell();
}

function packageSaleStateInCell(saleState: SaleStateParams) {
  const generalStateCell = packageGeneralStateInCell(saleState.generalState)
  const creatorRoundStateCell = packageCreatorRoundStateInCell(saleState.creatorRoundState)
  const wlRoundStateCell = packageWlRoundStateInCell(saleState.wlRoundState)
  const publicRoundStateCell = packagePublicRoundStateInCell(saleState.publicRoundState)
  return beginCell()
    .storeRef(generalStateCell)
    .storeRef(creatorRoundStateCell)
    .storeRef(wlRoundStateCell)
    .storeRef(publicRoundStateCell)
    .endCell();
}

function packageToolsInCell(tools: ToolsParams) {
  return beginCell()
    .storeAddress(tools.utilJetWalletAddress)
    .storeAddress(tools.futJetMasterAddress)
    .storeAddress(tools.futJetWalletAddress)
    .storeRef(tools.metadata)
    .storeRef(tools.futJetMasterCode)
    .storeRef(tools.walletCode)
    .storeRef(tools.userVaultCode)
    .endCell();
}

export function tokenLauncherConfigToCell(config: TokenLaunchStorage): Cell {
  const {
    creatorAddress,
    chiefAddress,
    operationalNeeds,
    isInitialized
  } = config;

  const saleConfigCell = packageSaleConfigInCell(config.saleConfig)
  const saleStateCell = packageSaleStateInCell(config.saleState)
  const toolsCell = packageToolsInCell(config.tools);

  return beginCell()
    .storeBit(isInitialized)
    .storeCoins(operationalNeeds)
    .storeAddress(chiefAddress)
    .storeAddress(creatorAddress)
    .storeRef(saleConfigCell)
    .storeRef(saleStateCell)
    .storeRef(toolsCell)
    .endCell();
}


