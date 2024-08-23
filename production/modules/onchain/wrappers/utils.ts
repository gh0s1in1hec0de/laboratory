import { beginCell, Cell, Sender } from "@ton/core";
import type {
    WhitelistRoundState,
    TokenLaunchStorage,
    CreatorRoundState,
    PublicRoundState,
    GeneralState,
    CoreStorage,
    SaleConfig,
    SaleState,
    Coins,
    Tools,
} from "starton-periphery";

export type SendMessageParams = {
    via: Sender,
    value: Coins,
    queryId: bigint
}

/* === CORE === */

export function coreConfigToCell(config: CoreStorage): Cell {
    const contractsCell = beginCell()
        .storeRef(config.contracts.tokenLaunch)
        .storeRef(config.contracts.userVault)
        .storeRef(config.contracts.jettonMaster)
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
        .storeInt(config.launchConfig.claimDurationMs, 32)
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

/* === TOKEN LAUNCH === */

function packageSaleConfigInCell(saleConfig: SaleConfig) {
    return beginCell()
        .storeCoins(saleConfig.futJetTotalSupply)
        .storeCoins(saleConfig.minTonForSaleSuccess)
        .storeCoins(saleConfig.futJetDexAmount)
        .storeCoins(saleConfig.futJetPlatformAmount)
        .storeCoins(saleConfig.rewardUtilJetsTotalAmount)
        .endCell();
}

function packageGeneralStateInCell(generalState: GeneralState) {
    return beginCell()
        .storeInt(generalState.startTime, 32)
        .storeCoins(generalState.futJetInnerBalance)
        .storeCoins(generalState.futJetDeployedBalance)
        .storeCoins(generalState.totalTonsCollected)
        .storeCoins(generalState.rewardUtilJetsBalance)
        .storeInt(generalState.endTime, 32)
        .endCell();
}

function packageCreatorRoundStateInCell(creatorRoundState: CreatorRoundState) {
    return beginCell()
        .storeCoins(creatorRoundState.futJetLimit)
        .storeCoins(creatorRoundState.futJetBalance)
        .storeCoins(creatorRoundState.creatorFutJetPrice)
        .storeInt(creatorRoundState.endTime, 32)
        .endCell();
}

function packageWlRoundStateInCell(wlRoundState: WhitelistRoundState) {
    return beginCell()
        .storeCoins(wlRoundState.futJetLimit)
        .storeCoins(wlRoundState.tonLimit)
        .storeCoins(wlRoundState.wlPassUtilJetAmount)
        .storeCoins(wlRoundState.wlBurnUtilJetAmount)
        .storeCoins(wlRoundState.tonInvestedTotal)
        .storeInt(wlRoundState.endTime, 32)
        .endCell();
}

function packagePublicRoundStateInCell(publicRoundState: PublicRoundState) {
    return beginCell()
        .storeCoins(publicRoundState.futJetLimit)
        .storeCoins(publicRoundState.futJetSold)
        .storeCoins(publicRoundState.syntheticJetReserve)
        .storeCoins(publicRoundState.syntheticTonReserve)
        .storeInt(publicRoundState.endTime, 32)
        .endCell();
}

function packageSaleStateInCell(saleState: SaleState) {
    const generalStateCell = packageGeneralStateInCell(saleState.general);
    const creatorRoundStateCell = packageCreatorRoundStateInCell(saleState.creatorRound);
    const wlRoundStateCell = packageWlRoundStateInCell(saleState.wlRound);
    const publicRoundStateCell = packagePublicRoundStateInCell(saleState.pubRound);
    return beginCell()
        .storeRef(generalStateCell)
        .storeRef(creatorRoundStateCell)
        .storeRef(wlRoundStateCell)
        .storeRef(publicRoundStateCell)
        .endCell();
}

function packageToolsInCell(tools: Tools) {
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

export function tokenLaunchConfigToCell(config: TokenLaunchStorage): Cell {
    const {
        creatorAddress,
        chiefAddress,
        operationalNeeds,
        isInitialized
    } = config;
    return beginCell()
        .storeBit(isInitialized)
        .storeCoins(operationalNeeds)
        .storeAddress(chiefAddress)
        .storeAddress(creatorAddress)
        .storeRef(packageSaleConfigInCell(config.saleConfig))
        .storeRef(packageSaleStateInCell(config.saleState))
        .storeRef(packageToolsInCell(config.tools))
        .endCell();
}


