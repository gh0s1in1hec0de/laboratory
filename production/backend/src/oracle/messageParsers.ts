import { Slice } from "@ton/core";
import type { BalanceUpdateMessage, RefundOrClaimConfirmationMessage } from "./types.ts";

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
    changedSlice: Slice,
    op: number,
    queryId: number
}> {
    const op = messageBody.loadUint(OP_LENGTH);
    const queryId = messageBody.loadUint(QUERY_ID_LENGTH);
    return { changedSlice: messageBody, op, queryId };
}

// Op and query id had already been loaded
export function ParseBalanceUpdate(purifiedMessageBody: Slice): BalanceUpdateMessage {
    const mode = purifiedMessageBody.loadUint(4);
    const tons = purifiedMessageBody.loadCoins();
    const futureJettons = purifiedMessageBody.loadCoins();
    purifiedMessageBody.endParse();
    return { mode, tons, futureJettons };
}

// Op and query id had already been loaded
export function ParseRefundOrClaim(purifiedMessageBody: Slice): RefundOrClaimConfirmationMessage {
    const whitelistTons = purifiedMessageBody.loadCoins();
    const publicTons = purifiedMessageBody.loadCoins();
    const futureJettons = purifiedMessageBody.loadCoins();
    const recipient = purifiedMessageBody.loadAddress().toRawString();
    purifiedMessageBody.endParse();
    return { whitelistTons, publicTons, futureJettons, recipient };
}