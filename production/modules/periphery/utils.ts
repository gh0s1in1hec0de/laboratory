import { beginCell, Cell, fromNano, toNano } from "@ton/core";
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

export function validateValue(total: Coins, fee: Coins): { purified: Coins, opn: Coins } {
    assert(!(fee > total), "not enough gas");
    const extra = total - fee;
    const purified = extra * 99n / 100n;
    assert(purified > 0, "balance lack");
    return { purified, opn: extra - purified };
}

export function getAmountOut(amountIn: Coins, reserveIn: Coins, reserveOut: Coins): Coins {
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = reserveIn * reserveOut / newReserveIn;
    const amountOut = reserveOut - newReserveOut;
    assert(amountOut > 0, "amount out must be positive");
    return amountOut;
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

export enum SortField {
    CREATED_AT = "created_at"
}