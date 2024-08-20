import {
    type WithdrawConfirmationMessage,
    type BalanceUpdateMessage,
    BalanceUpdateMode,
} from "./types";
import type { JsonLaunchMetadata, StoredTimings } from "../db";
import type { Coins } from "../utils.ts";
import type { Address } from "@ton/ton";
import { Cell, Slice } from "@ton/core";

const OP_LENGTH = 32;
const QUERY_ID_LENGTH = 64;

export enum CoreOps {
    // We'll use it for config parsing maybe
    init = 0x18add407,
    // Tracking new launches
    create_launch = 0x0eedbf42,
    upgrade = 0x055d212a,
}

export enum TokensLaunchOps {
    init = 0x358b2487,
    creatorBuyout = 0x0a535100,
    publicBuy = 0x16ee6c2d,
    // wlRequest = transfer_notification
    wlCallback = 0x390f7cfd,
    refundRequest = 0x7b4587a1,
    refundConfirmation = 0x6f7dbcd0,
    jettonClaimRequest = 0x16b3aef0,
    jettonClaimConfirmation = 0x349c1c7f,
    deployJet = 0x71161970,
}

export enum UserVaultOps {
    balanceUpdate = 0x00399d7a,
    claim = 0x556a6246,
}


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

export type GeneralState = {
    startTime: number,
    futJetInnerBalance: Coins,
    futJetDeployedBalance: Coins,
    totalTonsCollected: Coins,
    rewardUtilJetsBalance: Coins,
    endTime: number,
};

export type CreatorRoundState = {
    creatorFutJetLimit: Coins,
    creatorFutJetBalance: Coins,
    creatorFutJetPrice: Coins,
    creatorRoundEndTime: number,
};

export type WhitelistRoundState = {
    wlFutJetLimit: Coins,
    wlTonLimit: Coins,
    wlPassUtilJetAmount: Coins,
    wlBurnUtilJetAmount: Coins,
    wlTonInvestedTotal: Coins,
    wlEndTime: number,
};

export type PublicRoundState = {
    pubFutJetLimit: Coins,
    pubFutJetSold: Coins,
    syntheticJetReserve: Coins,
    syntheticTonReserve: Coins,
    pubEndTime: number,
};

export type SaleState = {
    general: GeneralState,
    creatorRound: CreatorRoundState,
    wlRound: WhitelistRoundState,
    pubRound: PublicRoundState,
};

export type Tools = {
    utilJetWalletAddress: Address,
    futJetMasterAddress: Address,
    futJetWalletAddress: Address,
    metadata: Cell,
    futJetMasterCode: Cell,
    walletCode: Cell,
    userVaultCode: Cell,
};

export type SaleConfig = {
    futJetTotalSupply: Coins,
    minTonForSaleSuccess: Coins,
    futJetDexAmount: Coins,
    futJetPlatformAmount: Coins,
    rewardUtilJetsTotalAmount: Coins,
};

export type TokenLaunchStorage = {
    isInitialized: boolean,
    operationalNeeds: Coins,
    chiefAddress: Address,
    creatorAddress: Address,
    saleConfig: SaleConfig,
    saleState: SaleState,
    tools: Tools,
};

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
        creatorFutJetLimit: creatorRoundStateSlice.loadCoins(),
        creatorFutJetBalance: creatorRoundStateSlice.loadCoins(),
        creatorFutJetPrice: creatorRoundStateSlice.loadCoins(),
        creatorRoundEndTime: creatorRoundStateSlice.loadInt(32),
    };
    creatorRoundStateSlice.endParse();


    const wlRoundStateRef = saleStateSlice.loadRef();
    const wlRoundStateSlice = wlRoundStateRef.beginParse();
    const wlRound: WhitelistRoundState = {
        wlFutJetLimit: wlRoundStateSlice.loadCoins(),
        wlTonLimit: wlRoundStateSlice.loadCoins(),
        wlPassUtilJetAmount: wlRoundStateSlice.loadCoins(),
        wlBurnUtilJetAmount: wlRoundStateSlice.loadCoins(),
        wlTonInvestedTotal: wlRoundStateSlice.loadCoins(),
        wlEndTime: wlRoundStateSlice.loadInt(32),
    };
    wlRoundStateSlice.endParse();

    const publicRoundStateRef = saleStateSlice.loadRef();
    const publicRoundStateSlice = publicRoundStateRef.beginParse();
    const pubRound: PublicRoundState = {
        pubFutJetLimit: publicRoundStateSlice.loadCoins(),
        pubFutJetSold: publicRoundStateSlice.loadCoins(),
        syntheticJetReserve: publicRoundStateSlice.loadCoins(),
        syntheticTonReserve: publicRoundStateSlice.loadCoins(),
        pubEndTime: publicRoundStateSlice.loadInt(32),
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
    const jetTools: Tools = {
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
        tools: jetTools,
    };
}

export function parseMetadataCell(metadataCell: Cell): JsonLaunchMetadata {
    const cs = metadataCell.beginParse();
    const uri = cs.loadStringTail();
    cs.endParse();
    return { url: uri };
}

export function parseTokenLaunchTimings(tokenLaunchStorage: TokenLaunchStorage): StoredTimings {
    return  {
        startTime: new Date(tokenLaunchStorage.saleState.general.startTime * 1000),
        creatorRoundTime: new Date(tokenLaunchStorage.saleState.creatorRound.creatorRoundEndTime * 1000),
        wlRoundTime: new Date(tokenLaunchStorage.saleState.wlRound.wlEndTime * 1000),
        publicRoundTime: new Date(tokenLaunchStorage.saleState.pubRound.pubEndTime * 1000),
        endTime: new Date(tokenLaunchStorage.saleState.general.endTime * 1000),
    };
}