import { GlobalVersions } from "../standards";
import { TokenLaunchTimings } from "../types";
import { UnixTimeSeconds } from "../utils";
import { toNano } from "@ton/core";
import {
    getApproximateWlAmountOut,
    getCreatorJettonPrice,
    getPublicAmountOut,
    SyntheticReserves,
    WlPhaseLimits
} from "./priceOracle";

export enum SalePhase {
    NOT_STARTED = "NOT_STARTED",
    CREATOR = "CREATOR",
    WHITELIST = "WHITELIST",
    PUBLIC = "PUBLIC",
    ENDED = "ENDED"
}

export function getCurrentSalePhase(
    timings: TokenLaunchTimings,
    currentTime: UnixTimeSeconds = Math.floor(Date.now() / 1000)
): { phase: SalePhase; nextPhaseIn: UnixTimeSeconds | null } {
    const { startTime, creatorRoundEndTime, wlRoundEndTime, publicRoundEndTime, endTime } = timings;

    if (currentTime < startTime)
        return { phase: SalePhase.NOT_STARTED, nextPhaseIn: startTime - currentTime };

    if (currentTime < creatorRoundEndTime)
        return { phase: SalePhase.CREATOR, nextPhaseIn: creatorRoundEndTime - currentTime };

    if (currentTime < wlRoundEndTime)
        return { phase: SalePhase.WHITELIST, nextPhaseIn: wlRoundEndTime - currentTime };

    if (currentTime < publicRoundEndTime)
        return { phase: SalePhase.PUBLIC, nextPhaseIn: publicRoundEndTime - currentTime };

    if (currentTime < endTime)
        return { phase: SalePhase.PUBLIC, nextPhaseIn: endTime - currentTime };

    return { phase: SalePhase.ENDED, nextPhaseIn: null };
}


// Returns an estimated value a participant will receive for their investment
export function getAmountOut(
    version: GlobalVersions,
    phase: SalePhase.CREATOR | SalePhase.WHITELIST | SalePhase.PUBLIC,
    data: WlPhaseLimits | SyntheticReserves,
    value = toNano("10")
) {
    if (phase === SalePhase.CREATOR && (data as WlPhaseLimits).wlRoundFutJetLimit !== undefined)
        return getCreatorJettonPrice(data as WlPhaseLimits);

    if (phase === SalePhase.CREATOR && (data as WlPhaseLimits).wlRoundFutJetLimit !== undefined)
        return getApproximateWlAmountOut(data as WlPhaseLimits, version, value);

    if (phase === SalePhase.PUBLIC && (data as SyntheticReserves).syntheticTonReserve !== undefined)
        return getPublicAmountOut(data as SyntheticReserves, version, value);

    throw new Error("meowreachable");
}

