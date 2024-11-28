import { GetConfigResponse, MoneyFlows } from "../types";
import { Coins, GlobalVersions } from "../standards";
import { ok as assert } from "assert";
import { fromNano, toNano } from "@ton/core";
import { fees } from "../fees";
import { jettonFromNano } from "../utils";

// 10k TON
export const MAX_WL_ROUND_TON_LIMIT = 10000n * toNano("1");
export const PERCENTAGE_DENOMINATOR = 100000n;
export const ONCHAIN_FEE = 2n;

export function validateValueMock(total: Coins, fee: Coins): { purified: Coins, opn: Coins } {
    assert(fee < total, "not enough gas");
    const extra = total - fee;
    const purified = extra * (100n - ONCHAIN_FEE) / 100n;
    assert(purified > 0, "balance lack");
    return { purified, opn: extra - purified };
}

export function getAmountOutMock(amountIn: Coins, reserveIn: Coins, reserveOut: Coins): Coins {
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = reserveIn * reserveOut / newReserveIn;
    const amountOut = reserveOut - newReserveOut;
    assert(amountOut > 0, "amount out must be positive");
    return amountOut;
}

export type WlPhaseLimits = { wlRoundFutJetLimit: Coins, wlRoundTonLimit: Coins };

// === CREATOR ===
export function getCreatorJettonPrice({ wlRoundFutJetLimit, wlRoundTonLimit }: WlPhaseLimits): Coins {
    return wlRoundFutJetLimit * 2n * MAX_WL_ROUND_TON_LIMIT / wlRoundTonLimit;
}

// Call get config to get the last two values`get_config`
export function getCreatorAmountOut(version: GlobalVersions, value: Coins, WlPhaseLimits: WlPhaseLimits, expectedFee?: Coins): Coins {
    const { purified } = validateValueMock(value, expectedFee ?? fees[version].creatorBuyout);
    const creatorJettonPrice = getCreatorJettonPrice(WlPhaseLimits);
    return purified * creatorJettonPrice / MAX_WL_ROUND_TON_LIMIT;
}

export function getCreatorValueLimit({ creatorFutJetLeft, creatorFutJetPriceReversed }: {
    creatorFutJetLeft: Coins,
    creatorFutJetPriceReversed: Coins
}): Coins {
    return creatorFutJetLeft * MAX_WL_ROUND_TON_LIMIT / creatorFutJetPriceReversed;
}

export function getExpectedWlValueShare(value: Coins, expectedFee: Coins): Coins {
    return validateValueMock(value, expectedFee).purified;
}

export function getApproximateWlAmountOut(
    { wlRoundFutJetLimit, wlRoundTonLimit }: WlPhaseLimits,
    version: GlobalVersions,
    value: Coins = toNano("10")
): Coins {
    const purifiedValue: Coins = getExpectedWlValueShare(value, fees[version].wlPurchase);
    // To calculate amount wl amount out we need to calculate our future share
    return wlRoundFutJetLimit * purifiedValue / (purifiedValue + wlRoundTonLimit);
}

export function getCurrentWlRate(wlRoundFutJetLimit: Coins, wlRoundTonInvestedTotal: Coins): number {
    return Number(fromNano(wlRoundTonInvestedTotal)) / Number(jettonFromNano(wlRoundFutJetLimit));
}

// Call get config to get the last two values`get_config`
export type SyntheticReserves = {
    syntheticTonReserve: Coins,
    syntheticJetReserve: Coins
}

export function getPublicAmountOut(
    reserves: SyntheticReserves,
    version: GlobalVersions,
    value: Coins = toNano("10"),
): Coins {
    const { purified } = validateValueMock(value, fees[version].pubPurchase);
    return getAmountOutMock(
        purified,
        reserves.syntheticTonReserve,
        reserves.syntheticJetReserve
    );
}

export function getApproximateClaimAmount(
    { publicRoundFutJetSold, wlRoundTonInvestedTotal, creatorFutJetBalance }: MoneyFlows,
    { pubRoundFutJetLimit, wlRoundFutJetLimit }: GetConfigResponse,
    // StoredUserBalance
    share: { whitelistTons: Coins, jettons: Coins },
    // isCreator ExtendedUserBalance
    isCreator: boolean = false
): Coins {
    let futJetRecipientTotalAmount = share.jettons;
    if (share.whitelistTons > 0n) {
        const publicRemainings = pubRoundFutJetLimit - publicRoundFutJetSold;
        const wlRoundFurJetFinalAmount = wlRoundFutJetLimit + publicRemainings;

        const jettonWlShare = wlRoundFurJetFinalAmount * share.whitelistTons / wlRoundTonInvestedTotal;
        futJetRecipientTotalAmount += jettonWlShare;
    }
    if (isCreator) futJetRecipientTotalAmount += creatorFutJetBalance;
    return futJetRecipientTotalAmount;
}

/**
 * Calculates the reward amount a user should receive based on their claim.
 *
 * @param userClaimAmount - Can be derived with `getApproximateClaimAmount` and `UserBalance` returned data.
 * @param launchSupply - The total supply of token launch `UserBalance` belongs to, `ExtendedUserBalance.totalSupply`.
 * @param rewardPoolSupply - Total amount of reward jettons in the pool.
 * @returns The calculated reward amount as a bigint.
 */
// jettonFromNano
export function calculateUserRewardAmount(
    // getApproximateClaimAmount
    userClaimAmount: Coins,
    // totalSupply => ExtendedUserBalance
    launchSupply: Coins,
    // MappedRewardPools => rewardAmount
    rewardPoolSupply: Coins
): Coins {
    return userClaimAmount * rewardPoolSupply / launchSupply;
}
