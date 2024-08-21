import { TokenLaunchStorage } from "./types";

// It is not in types as it parsing-sugar entity
export type TokenLaunchTimings = {
    startTime: Date,
    creatorRoundTime: Date,
    wlRoundTime: Date,
    publicRoundTime: Date,
    endTime: Date,
};

export function parseTokenLaunchTimings(tokenLaunchStorage: TokenLaunchStorage): TokenLaunchTimings {
    return {
        startTime: new Date(tokenLaunchStorage.saleState.general.startTime * 1000),
        creatorRoundTime: new Date(tokenLaunchStorage.saleState.creatorRound.creatorRoundEndTime * 1000),
        wlRoundTime: new Date(tokenLaunchStorage.saleState.wlRound.wlEndTime * 1000),
        publicRoundTime: new Date(tokenLaunchStorage.saleState.pubRound.pubEndTime * 1000),
        endTime: new Date(tokenLaunchStorage.saleState.general.endTime * 1000),
    };
}