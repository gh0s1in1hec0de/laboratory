import { beginCell, Cell, fromNano, Slice, toNano } from "@ton/core";
import { ok as assert } from "node:assert";
import { Coins, TokenMetadata } from "./standards";
import { TokenLaunchStorageV1 } from "./V1";
import { TokenLaunchStorageV2A } from "./V2A";
import { TokenLaunchTimings } from "./types";

export function parseTokenLaunchTimings(tokenLaunchStorage: TokenLaunchStorageV1 | TokenLaunchStorageV2A, pollingDuration: number = 14 * 86400): TokenLaunchTimings {
    return {
        startTime: new Date(tokenLaunchStorage.saleState.general.startTime * 1000),
        creatorRoundEndTime: new Date(tokenLaunchStorage.saleState.creatorRound.endTime * 1000),
        wlRoundEndTime: new Date(tokenLaunchStorage.saleState.wlRound.endTime * 1000),
        publicRoundEndTime: new Date(tokenLaunchStorage.saleState.pubRound.endTime * 1000),
        endTime: new Date(pollingDuration * 1000),
    };
}

export function tokenMetadataToCell(content: TokenMetadata): Cell {
    return beginCell()
        .storeStringRefTail(content.uri) // Snake logic under the hood
        .endCell();
}


export function endParse(slice: Slice) {
    if (slice.remainingBits > 0 || slice.remainingRefs > 0) {
        throw new Error("remaining bits in data");
    }
}

export function jettonToNano(amount: number | bigint | string, decimals: number = 6) {
    const nineDecimalsRes = toNano(amount);
    if (decimals > 9) return nineDecimalsRes * BigInt(9 - decimals);
    if (decimals < 9) return nineDecimalsRes / BigInt(decimals - 9);
    return nineDecimalsRes;
}

export function jettonFromNano(amount: number | bigint | string, decimals: number = 6) {
    assert(decimals <= 9, "not supported yet");
    return fromNano(decimals < 9 ? BigInt(amount) * BigInt(9 - decimals) : amount);
}

export function getQueryId() {
    const currentTimeMs = Date.now();
    const secs = Math.floor(currentTimeMs / 1000);
    const ms = currentTimeMs % 1000;

    const remainder = secs % 17;
    const closestDivisible = remainder ? secs - remainder : secs;

    return closestDivisible * 1000 + ms;
}

export enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}

export enum TokenLaunchFields {
    CREATED_AT = "created_at"
}