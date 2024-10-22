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

export function getCurrentSalePhase(timings: TokenLaunchTimings, currentTime: UnixTimeSeconds = Math.floor(Date.now() / 1000)): SalePhase {
    const { startTime, creatorRoundEndTime, wlRoundEndTime, publicRoundEndTime, endTime } = timings;

    if (currentTime < startTime) return SalePhase.NOT_STARTED;
    else if (currentTime >= startTime && currentTime < creatorRoundEndTime) return SalePhase.CREATOR;
    else if (currentTime >= creatorRoundEndTime && currentTime < wlRoundEndTime) return SalePhase.WHITELIST;
    else if (currentTime >= wlRoundEndTime && currentTime < publicRoundEndTime) return SalePhase.PUBLIC;
    else if (currentTime >= publicRoundEndTime && currentTime <= endTime) return SalePhase.PUBLIC;  // Public phase continues until the end
    else if (currentTime > endTime) return SalePhase.ENDED;

    throw new Error("meowreachable");
}

// Returns an estimated value a participant will receive for their investment
export function getAmountOut(
    phase: SalePhase.CREATOR | SalePhase.WHITELIST | SalePhase.PUBLIC,
    data: WlPhaseLimits | SyntheticReserves, value = toNano("10")
) {
    if (phase === SalePhase.CREATOR && (data as WlPhaseLimits).wlRoundFutJetLimit !== undefined)
        return getCreatorJettonPrice(data as WlPhaseLimits);

    if (phase === SalePhase.CREATOR && (data as WlPhaseLimits).wlRoundFutJetLimit !== undefined)
        return getApproximateWlAmountOut(data as WlPhaseLimits, value);

    if (phase === SalePhase.PUBLIC && (data as SyntheticReserves).syntheticTonReserve !== undefined)
        return getPublicAmountOut(data as SyntheticReserves, value);

    throw new Error("meowreachable");
}

