import type {
    PublicRoundStateDeprecated, GeneralStateDeprecated, SaleConfigDeprecated, SaleStateDeprecated, ToolsDeprecated,
    WhitelistRoundStateDeprecated, DeprecatedTokenLaunchStorage, CreatorRoundStateDeprecated,
} from "./types";
import { Cell } from "@ton/core";

// Confirm after changes
export function parseDeprecatedTokenLaunchStorage(storage: Cell): DeprecatedTokenLaunchStorage {
    const ds = storage.beginParse();

    // Parse isInitialized (int1) and operationalNeeds (Coins)
    const isInitialized = ds.loadBoolean();
    const operationalNeeds = ds.loadCoins();

    // Parse chiefAddress and creatorAddress (Address)
    const chiefAddress = ds.loadAddress();
    const creatorAddress = ds.loadAddress();

    // Parse SaleConfig
    const saleConfigRef = ds.loadRef();
    const saleConfigSlice = saleConfigRef.beginParse();
    const saleConfig: SaleConfigDeprecated = {
        futJetTotalSupply: saleConfigSlice.loadCoins(),
        minTonForSaleSuccess: saleConfigSlice.loadCoins(),
        futJetDexAmount: saleConfigSlice.loadCoins(),
        futJetPlatformAmount: saleConfigSlice.loadCoins(),
        rewardUtilJetsTotalAmount: saleConfigSlice.loadCoins(),
    };
    saleConfigSlice.endParse();

    // Parse SaleState
    const saleStateRef = ds.loadRef();
    const saleStateSlice = saleStateRef.beginParse();

    const generalStateRef = saleStateSlice.loadRef();
    const generalStateSlice = generalStateRef.beginParse();
    const general: GeneralStateDeprecated = {
        startTime: generalStateSlice.loadInt(32),
        futJetInnerBalance: generalStateSlice.loadCoins(),
        futJetDeployedBalance: generalStateSlice.loadCoins(),
        totalTonsCollected: generalStateSlice.loadCoins(),
        rewardUtilJetsBalance: generalStateSlice.loadCoins(),
    };
    generalStateSlice.endParse();


    const creatorRoundStateRef = saleStateSlice.loadRef();
    const creatorRoundStateSlice = creatorRoundStateRef.beginParse();
    const creatorRound: CreatorRoundStateDeprecated = {
        futJetLeft: creatorRoundStateSlice.loadCoins(),
        futJetBalance: creatorRoundStateSlice.loadCoins(),
        creatorFutJetPrice: creatorRoundStateSlice.loadCoins(),
        endTime: creatorRoundStateSlice.loadInt(32),
    };
    creatorRoundStateSlice.endParse();


    const wlRoundStateRef = saleStateSlice.loadRef();
    const wlRoundStateSlice = wlRoundStateRef.beginParse();
    const wlRound: WhitelistRoundStateDeprecated = {
        futJetLimit: wlRoundStateSlice.loadCoins(),
        tonLimit: wlRoundStateSlice.loadCoins(),
        wlPassUtilJetAmount: wlRoundStateSlice.loadCoins(),
        wlBurnUtilJetAmount: wlRoundStateSlice.loadCoins(),
        tonInvestedTotal: wlRoundStateSlice.loadCoins(),
        endTime: wlRoundStateSlice.loadInt(32),
    };
    wlRoundStateSlice.endParse();

    const publicRoundStateRef = saleStateSlice.loadRef();
    const publicRoundStateSlice = publicRoundStateRef.beginParse();
    const pubRound: PublicRoundStateDeprecated = {
        futJetLimit: publicRoundStateSlice.loadCoins(),
        futJetSold: publicRoundStateSlice.loadCoins(),
        syntheticJetReserve: publicRoundStateSlice.loadCoins(),
        syntheticTonReserve: publicRoundStateSlice.loadCoins(),
        endTime: publicRoundStateSlice.loadInt(32),
    };
    publicRoundStateSlice.endParse();

    const saleState: SaleStateDeprecated = {
        general,
        creatorRound,
        wlRound,
        pubRound,
    };
    const toolsRef = ds.loadRef();
    const toolsSlice = toolsRef.beginParse();
    const tools: ToolsDeprecated = {
        utilJetWalletAddress: toolsSlice.loadAddress(),
        futJetMasterAddress: toolsSlice.loadAddress(),
        futJetWalletAddress: toolsSlice.loadAddress(),
        metadata: toolsSlice.loadRef(),
        futJetMasterCode: toolsSlice.loadRef(),
        walletCode: toolsSlice.loadRef(),
        userVaultCode: toolsSlice.loadRef(),
    };
    toolsSlice.endParse();

    ds.endParse();
    return {
        isInitialized,
        operationalNeeds,
        chiefAddress,
        creatorAddress,
        saleConfig,
        saleState,
        tools,
    };
}