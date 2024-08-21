import { TokenLaunchStorage, TokenLaunchTimings, TokenMetadata } from "./types";
import { beginCell, Cell } from "@ton/core";

export function parseTokenLaunchTimings(tokenLaunchStorage: TokenLaunchStorage): TokenLaunchTimings {
    return {
        startTime: new Date(tokenLaunchStorage.saleState.general.startTime * 1000),
        creatorRoundTime: new Date(tokenLaunchStorage.saleState.creatorRound.endTime * 1000),
        wlRoundTime: new Date(tokenLaunchStorage.saleState.wlRound.endTime * 1000),
        publicRoundTime: new Date(tokenLaunchStorage.saleState.pubRound.endTime * 1000),
        endTime: new Date(tokenLaunchStorage.saleState.general.endTime * 1000),
    };
}

export function tokenMetadataToCell(content: TokenMetadata): Cell {
    return beginCell()
        .storeStringRefTail(content.uri) // Snake logic under the hood
        .endCell();
}