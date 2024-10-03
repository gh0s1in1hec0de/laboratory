import { GetConfigResponse, MoneyFlows, TokenLaunchTimings } from "./types";
import { Cell, type Slice, TupleReader } from "@ton/core";
import {
    BalanceUpdateMessage,
    OP_LENGTH,
    QUERY_ID_LENGTH,
    TokenMetadata,
    TokensLaunchOps,
    WithdrawConfirmationMessage,
} from "./standards";
import { UnixTimeSeconds } from "./utils";

// === Message parsers ===

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
export function parseRefundOrClaim(op: TokensLaunchOps, purifiedMessageBody: Slice): WithdrawConfirmationMessage {
    const whitelistTons = purifiedMessageBody.loadCoins();
    const publicTons = purifiedMessageBody.loadCoins();
    const futureJettons = purifiedMessageBody.loadCoins();
    const recipient = purifiedMessageBody.loadAddress().toRawString();
    const mode = op === TokensLaunchOps.ClaimOpn ? undefined : purifiedMessageBody.loadUint(4);
    return { whitelistTons, publicTons, futureJettons, recipient, mode };
}

export function parseMetadataCell(metadataCell: Cell): TokenMetadata {
    const cs = metadataCell.beginParse();
    const uri = cs.loadStringTail();
    cs.endParse();
    return { uri };
}

// Getters
export function parseMoneyFlows(stack: TupleReader): MoneyFlows {
    return {
        totalTonsCollected: stack.readBigNumber(),
        creatorFutJetBalance: stack.readBigNumber(),
        wlRoundTonInvestedTotal: stack.readBigNumber(),
        publicRoundFutJetSold: stack.readBigNumber(),
        syntheticJetReserve: stack.readBigNumber(),
        syntheticTonReserve: stack.readBigNumber(),
    };
}

export function parseGetConfigResponse(stack: TupleReader): GetConfigResponse {
    return {
        creatorFutJetBalance: stack.readBigNumber(),
        creatorFutJetLeft: stack.readBigNumber(),
        creatorFutJetPriceReversed: stack.readBigNumber(),

        wlRoundFutJetLimit: stack.readBigNumber(),
        pubRoundFutJetLimit: stack.readBigNumber(),

        futJetDexAmount: stack.readBigNumber(),
        futJetPlatformAmount: stack.readBigNumber(),

        minTonForSaleSuccess: stack.readBigNumber(),
    };
}

export function parseTimings(stack: TupleReader, pollingDuration: number = 2 * 86400): TokenLaunchTimings {
    const startTime = stack.readNumber();
    const creatorRoundEndTime = stack.readNumber();
    const wlRoundEndTime = stack.readNumber();
    const publicRoundEndTime = stack.readNumber();
    const endTime = publicRoundEndTime + pollingDuration;
    return {
        startTime,
        creatorRoundEndTime,
        wlRoundEndTime,
        publicRoundEndTime,
        endTime,
    };
}

export function parseJettonTransfer(purifiedMessageBody: Slice) {
    return {
        jettonAmount: purifiedMessageBody.loadCoins(),
        to: purifiedMessageBody.loadAddress(),
        response: purifiedMessageBody.loadAddress(),
        customPayload: purifiedMessageBody.loadMaybeRef(),
        forwardTons: purifiedMessageBody.loadCoins(),
        forwardPayload: purifiedMessageBody.loadMaybeRef()
    }
}