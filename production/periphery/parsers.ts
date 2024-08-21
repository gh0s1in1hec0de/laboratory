import { OP_LENGTH, QUERY_ID_LENGTH } from "./types";
import { Cell, Slice } from "@ton/core";
import type {
    WithdrawConfirmationMessage,
    BalanceUpdateMessage,
    WhitelistRoundState,
    TokenLaunchStorage,
    BalanceUpdateMode,
    CreatorRoundState,
    PublicRoundState,
    TokenMetadata,
    GeneralState,
    SaleConfig,
    SaleState,
    Tools,
} from "./types";

export async function loadOpAndQueryId(messageBody: Slice): Promise<{
    msgBodyData: Slice,
    op: number,
    queryId: bigint,
}> {
    const op = messageBody.loadUint(OP_LENGTH);
    const queryId = messageBody.loadUintBig(QUERY_ID_LENGTH);
    return { msgBodyData: messageBody, op, queryId };
}

// Op and query id had already been loaded
export function parseBalanceUpdate(purifiedMessageBody: Slice): BalanceUpdateMessage {
    const mode = purifiedMessageBody.loadUint(4);
    const tons = purifiedMessageBody.loadCoins();
    const futureJettons = purifiedMessageBody.loadCoins();
    purifiedMessageBody.endParse();
    return { mode, tons, futureJettons };
}

// Op and query id had already been loaded
export function parseRefundOrClaim(purifiedMessageBody: Slice): WithdrawConfirmationMessage {
    const whitelistTons = purifiedMessageBody.loadCoins();
    const publicTons = purifiedMessageBody.loadCoins();
    const futureJettons = purifiedMessageBody.loadCoins();
    const recipient = purifiedMessageBody.loadAddress().toRawString();
    const mode = purifiedMessageBody.loadMaybeUint(4) as BalanceUpdateMode | undefined;
    return { whitelistTons, publicTons, futureJettons, recipient, mode };
}

export function parseTokenLaunchStorage(storage: Cell): TokenLaunchStorage {
    const ds = storage.beginParse();

    // Parse isInitialized (int1) and operationalNeeds (Coins)
    const isInitialized = ds.loadUint(1) === -1;
    const operationalNeeds = ds.loadCoins();

    // Parse chiefAddress and creatorAddress (Address)
    const chiefAddress = ds.loadAddress();
    const creatorAddress = ds.loadAddress();

    // Parse SaleConfig
    const saleConfigRef = ds.loadRef();
    const saleConfigSlice = saleConfigRef.beginParse();
    const saleConfig: SaleConfig = {
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
    const general: GeneralState = {
        startTime: generalStateSlice.loadInt(32),
        futJetInnerBalance: generalStateSlice.loadCoins(),
        futJetDeployedBalance: generalStateSlice.loadCoins(),
        totalTonsCollected: generalStateSlice.loadCoins(),
        rewardUtilJetsBalance: generalStateSlice.loadCoins(),
        endTime: generalStateSlice.loadInt(32),
    };
    generalStateSlice.endParse();


    const creatorRoundStateRef = saleStateSlice.loadRef();
    const creatorRoundStateSlice = creatorRoundStateRef.beginParse();
    const creatorRound: CreatorRoundState = {
        futJetLimit: creatorRoundStateSlice.loadCoins(),
        futJetBalance: creatorRoundStateSlice.loadCoins(),
        creatorFutJetPrice: creatorRoundStateSlice.loadCoins(),
        endTime: creatorRoundStateSlice.loadInt(32),
    };
    creatorRoundStateSlice.endParse();


    const wlRoundStateRef = saleStateSlice.loadRef();
    const wlRoundStateSlice = wlRoundStateRef.beginParse();
    const wlRound: WhitelistRoundState = {
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
    const pubRound: PublicRoundState = {
        futJetLimit: publicRoundStateSlice.loadCoins(),
        futJetSold: publicRoundStateSlice.loadCoins(),
        syntheticJetReserve: publicRoundStateSlice.loadCoins(),
        syntheticTonReserve: publicRoundStateSlice.loadCoins(),
        endTime: publicRoundStateSlice.loadInt(32),
    };
    publicRoundStateSlice.endParse();

    const saleState: SaleState = {
        general,
        creatorRound,
        wlRound,
        pubRound,
    };
    const toolsRef = ds.loadRef();
    const toolsSlice = toolsRef.beginParse();
    const tools: Tools = {
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

export function parseMetadataCell(metadataCell: Cell): TokenMetadata {
    const cs = metadataCell.beginParse();
    const uri = cs.loadStringTail();
    cs.endParse();
    return { uri: uri };
}