import { Coins, GlobalVersions } from "../standards";
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


/**
 * Returns an estimated value a participant will receive for their investment.
 *
 * ## Instructions:
 *
 * ### How to calculate creator's boundaries:
 * 1. Call `getAmountOut` with `value = 10 TON`. This will return the amount of nano jettons for this value.
 * 2. Calculate the amount of nano tons per one nano jetton:
 *    ```
 *    toNano(10) / receivedNanoJettons
 *    ```
 * 3. Perform the calculation:
 *    ```
 *    (totalSupply * 25 / 100) * value from step 2
 *    ```
 *    - **Note**: To avoid zeroing the result (since we are working with bigints), perform the following:
 *      ```
 *      (totalSupply * 25 / 100) * toNano(10) / receivedNanoJettons
 *      ```
 *      This ensures that the value from the first two operations is greater than the divisor.
 *
 * @param version - The version of the global configuration (e.g., `V1`, `V2`).
 * @param phase - The sale phase (`SalePhase.CREATOR`, `SalePhase.WHITELIST`, or `SalePhase.PUBLIC`).
 * @param data - The data structure containing phase-specific parameters (`WlPhaseLimits` or `SyntheticReserves`).
 * @param value - The input value in TONs for which to calculate the estimated amount (default: `toNano("10")`).
 * @returns The estimated amount of coins a participant will receive.
 * @throws Will throw an error if the phase or data does not match any expected combination.
 */
export function getAmountOut(
    version: GlobalVersions,
    phase: SalePhase.CREATOR | SalePhase.WHITELIST | SalePhase.PUBLIC,
    data: WlPhaseLimits | SyntheticReserves,
    value = toNano("10")
): Coins {
    if (phase === SalePhase.CREATOR && (data as WlPhaseLimits).wlRoundFutJetLimit !== undefined)
        return getCreatorJettonPrice(data as WlPhaseLimits);

    if (phase === SalePhase.WHITELIST && (data as WlPhaseLimits).wlRoundFutJetLimit !== undefined)
        return getApproximateWlAmountOut(data as WlPhaseLimits, version, value);

    if (phase === SalePhase.PUBLIC && (data as SyntheticReserves).syntheticTonReserve !== undefined)
        return getPublicAmountOut(data as SyntheticReserves, version, value);

    throw new Error("meowreachable");
}

// todo: blockchain getters

