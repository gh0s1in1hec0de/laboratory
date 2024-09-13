import { GetConfigResponse, MoneyFlows } from "./types";
import { Cell, Slice, TupleReader } from "@ton/core";
import {
    WithdrawConfirmationMessage,
    BalanceUpdateMessage,
    BalanceUpdateMode,
    QUERY_ID_LENGTH,
    TokenMetadata,
    OP_LENGTH,
} from "./standards";

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
export function parseRefundOrClaim(purifiedMessageBody: Slice): WithdrawConfirmationMessage {
    const whitelistTons = purifiedMessageBody.loadCoins();
    const publicTons = purifiedMessageBody.loadCoins();
    const futureJettons = purifiedMessageBody.loadCoins();
    const recipient = purifiedMessageBody.loadAddress().toRawString();
    const mode = purifiedMessageBody.loadMaybeUint(4) as BalanceUpdateMode | undefined;
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