import {Cell, Slice} from "@ton/core";
import type {BalanceUpdateMessage, RefundOrClaimConfirmationMessage} from "./types.ts";

const OP_LENGTH = 32;
const QUERY_ID_LENGTH = 64;

async function LoadOpAndQueryId(messageBody: Slice): Promise<{ changedSlice: Slice, op: number, queryId: number }> {
    const op = messageBody.loadUint(OP_LENGTH);
    const queryId = messageBody.loadUint(QUERY_ID_LENGTH);
    return {changedSlice: messageBody, op, queryId};
}

// Op and query id had already been loaded
function ParseBalanceUpdate(purifiedMessageBody: Slice): BalanceUpdateMessage {
    const mode = purifiedMessageBody.loadUint(4);
    const tons = purifiedMessageBody.loadCoins();
    const futureJettons = purifiedMessageBody.loadCoins();
    purifiedMessageBody.endParse();
    return {mode, tons, futureJettons};
}

// Op and query id had already been loaded
function ParseRefundOrClaim(purifiedMessageBody: Slice): RefundOrClaimConfirmationMessage {
    const whitelistTons = purifiedMessageBody.loadCoins();
    const publicTons = purifiedMessageBody.loadCoins();
    const futureJettons = purifiedMessageBody.loadCoins();
    const recipient = purifiedMessageBody.loadAddress().toRawString();
    purifiedMessageBody.endParse();
    return {whitelistTons, publicTons, futureJettons, recipient}
}