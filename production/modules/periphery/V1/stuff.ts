import type {
    PublicRoundStateV1, GeneralStateV1, SaleConfigV1, SaleStateV1, ToolsV1,
    WhitelistRoundStateV1, TokenLaunchStorageV1, CreatorRoundStateV1,
} from "./types";
import { Cell } from "@ton/core";

// Confirm after changes
export function parseTokenLaunchV1Storage(storage: Cell): TokenLaunchStorageV1 {
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
    const saleConfig: SaleConfigV1 = {
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
    const general: GeneralStateV1 = {
        startTime: generalStateSlice.loadInt(32),
        futJetInnerBalance: generalStateSlice.loadCoins(),
        futJetDeployedBalance: generalStateSlice.loadCoins(),
        totalTonsCollected: generalStateSlice.loadCoins(),
        rewardUtilJetsBalance: generalStateSlice.loadCoins(),
    };
    generalStateSlice.endParse();


    const creatorRoundStateRef = saleStateSlice.loadRef();
    const creatorRoundStateSlice = creatorRoundStateRef.beginParse();
    const creatorRound: CreatorRoundStateV1 = {
        futJetLeft: creatorRoundStateSlice.loadCoins(),
        futJetBalance: creatorRoundStateSlice.loadCoins(),
        creatorFutJetPrice: creatorRoundStateSlice.loadCoins(),
        endTime: creatorRoundStateSlice.loadInt(32),
    };
    creatorRoundStateSlice.endParse();


    const wlRoundStateRef = saleStateSlice.loadRef();
    const wlRoundStateSlice = wlRoundStateRef.beginParse();
    const wlRound: WhitelistRoundStateV1 = {
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
    const pubRound: PublicRoundStateV1 = {
        futJetLimit: publicRoundStateSlice.loadCoins(),
        futJetSold: publicRoundStateSlice.loadCoins(),
        syntheticJetReserve: publicRoundStateSlice.loadCoins(),
        syntheticTonReserve: publicRoundStateSlice.loadCoins(),
        endTime: publicRoundStateSlice.loadInt(32),
    };
    publicRoundStateSlice.endParse();

    const saleState: SaleStateV1 = {
        general,
        creatorRound,
        wlRound,
        pubRound,
    };
    const toolsRef = ds.loadRef();
    const toolsSlice = toolsRef.beginParse();
    const tools: ToolsV1 = {
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