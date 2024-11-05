import { GetConfigResponse, MoneyFlows } from "../types";
import { Coins, GlobalVersions } from "../standards";
import { ok as assert } from "assert";
import { toNano } from "@ton/core";
import { fees } from "../fees";

// 10k TON
export const MAX_WL_ROUND_TON_LIMIT = 10000n * toNano("1");
export const PERCENTAGE_DENOMINATOR = 100000n;

export function validateValueMock(total: Coins, fee: Coins): { purified: Coins, opn: Coins } {
    assert(fee < total, "not enough gas");
    const extra = total - fee;
    const purified = extra * 99n / 100n;
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
}) {
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
    const purifiedValue = getExpectedWlValueShare(
        value, fees[version].wlPurchase);
    return purifiedValue * wlRoundFutJetLimit / wlRoundTonLimit;
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
    share: { wlTons: Coins, jettons: Coins },
    isCreator: boolean = false
): Coins {
    let futJetRecipientTotalAmount = share.jettons;
    if (share.wlTons > 0) {
        const publicRemainings = pubRoundFutJetLimit - publicRoundFutJetSold;
        const wlRoundFurJetFinalAmount = wlRoundFutJetLimit + publicRemainings;

        const jettonWlShare = wlRoundFurJetFinalAmount * share.wlTons / wlRoundTonInvestedTotal;
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
export function calculateUserRewardAmount(
    userClaimAmount: Coins,
    launchSupply: Coins,
    rewardPoolSupply: Coins
): bigint {
    return userClaimAmount * rewardPoolSupply / launchSupply;
}
