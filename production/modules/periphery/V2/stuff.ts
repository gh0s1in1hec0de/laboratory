import { beginCell, Cell } from "@ton/core";
import {
    WhitelistRoundStateV2,
    TokenLaunchStorageV2,
    CreatorRoundStateV2,
    PublicRoundStateV2,
    GeneralStateV2,
    LaunchConfigV2,
    SaleConfigV2,
    SaleStateV2,
    ToolsV2,
} from "./types";

export function packLaunchConfigV2ToCell(c: LaunchConfigV2) {
    return beginCell()
        .storeCoins(c.minTonForSaleSuccess)
        .storeCoins(c.tonLimitForWlRound)
        .storeCoins(c.penny)

        .storeAddress(c.utilJetMasterAddress)
        .storeCoins(c.utilJetWlPassAmount)
        .storeCoins(c.utilJetWlPassOneTimePrice)

        .storeUint(c.jetWlLimitPct, 16)
        .storeUint(c.jetPubLimitPct, 16)
        .storeUint(c.jetDexSharePct, 16)

        .storeInt(c.creatorRoundDurationSec, 32)
        .storeInt(c.wlRoundDurationSec, 32)
        .storeInt(c.pubRoundDurationSec, 32)
        .endCell();
}

export function parseTokenLaunchV2Storage(storage: Cell): TokenLaunchStorageV2 {
    try {
        const ds = storage.beginParse();

        const isInitialized = ds.loadBoolean();
        const operationalNeeds = ds.loadCoins();
        const chiefAddress = ds.loadAddress();
        const creatorAddress = ds.loadAddress();

        const saleConfigRef = ds.loadRef();
        const saleConfigSlice = saleConfigRef.beginParse();
        const saleConfig: SaleConfigV2 = {
            futJetTotalSupply: saleConfigSlice.loadCoins(),
            minTonForSaleSuccess: saleConfigSlice.loadCoins(),
            futJetDexAmount: saleConfigSlice.loadCoins(),
            futJetPlatformAmount: saleConfigSlice.loadCoins(),
        };
        saleConfigSlice.endParse();

        // Parse SaleState
        const saleStateRef = ds.loadRef();
        const saleStateSlice = saleStateRef.beginParse();

        const generalStateRef = saleStateSlice.loadRef();
        const generalStateSlice = generalStateRef.beginParse();
        const general: GeneralStateV2 = {
            startTime: generalStateSlice.loadInt(32),
            futJetInnerBalance: generalStateSlice.loadCoins(),
            futJetDeployedBalance: generalStateSlice.loadCoins(),
            totalTonsCollected: generalStateSlice.loadCoins(),
        };
        generalStateSlice.endParse();


        const creatorRoundStateRef = saleStateSlice.loadRef();
        const creatorRoundStateSlice = creatorRoundStateRef.beginParse();
        const creatorRound: CreatorRoundStateV2 = {
            futJetLeft: creatorRoundStateSlice.loadCoins(),
            futJetBalance: creatorRoundStateSlice.loadCoins(),
            creatorFutJetPrice: creatorRoundStateSlice.loadCoins(),
            endTime: creatorRoundStateSlice.loadInt(32),
        };
        creatorRoundStateSlice.endParse();


        const wlRoundStateRef = saleStateSlice.loadRef();
        const wlRoundStateSlice = wlRoundStateRef.beginParse();
        const wlRound: WhitelistRoundStateV2 = {
            futJetLimit: wlRoundStateSlice.loadCoins(),
            tonLimit: wlRoundStateSlice.loadCoins(),
            utilJetWlPassAmount: wlRoundStateSlice.loadCoins(),
            utilJetWlPassOneTimePriceAmount: wlRoundStateSlice.loadCoins(),
            tonInvestedTotal: wlRoundStateSlice.loadCoins(),
            endTime: wlRoundStateSlice.loadInt(32),
        };
        wlRoundStateSlice.endParse();

        const publicRoundStateRef = saleStateSlice.loadRef();
        const publicRoundStateSlice = publicRoundStateRef.beginParse();
        const pubRound: PublicRoundStateV2 = {
            futJetLimit: publicRoundStateSlice.loadCoins(),
            futJetSold: publicRoundStateSlice.loadCoins(),
            syntheticJetReserve: publicRoundStateSlice.loadCoins(),
            syntheticTonReserve: publicRoundStateSlice.loadCoins(),
            endTime: publicRoundStateSlice.loadInt(32),
        };
        publicRoundStateSlice.endParse();

        const saleState: SaleStateV2 = {
            general,
            creatorRound,
            wlRound,
            pubRound,
        };
        const toolsRef = ds.loadRef();
        const toolsSlice = toolsRef.beginParse();
        const tools: ToolsV2 = {
            futJetMasterAddress: toolsSlice.loadMaybeAddress(),
            futJetWalletAddress: toolsSlice.loadMaybeAddress(),
            utilJetWalletAddress: toolsSlice.loadMaybeAddress(),
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
    } catch (e) {
        throw new Error(`Parsing V2A storage error: ${e}`);
    }
}