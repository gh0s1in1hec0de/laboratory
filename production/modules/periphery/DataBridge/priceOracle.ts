import { GetConfigResponse, MoneyFlows } from "../types";
import { Coins, GlobalVersions } from "../standards";
import { fromNano, toNano } from "@ton/core";
import { jettonFromNano } from "../utils";
import { ok as assert } from "assert";
import { fees } from "../fees";

// 10k TON
export const MAX_WL_ROUND_TON_LIMIT = 100000n * toNano("1");
export const PERCENTAGE_DENOMINATOR = 100000n;
export const PURCHASE_FEE_PERCENT = 1n;
export const REFUND_FEE_PERCENT = 3n;
export const REFERRAL_PAYMENT_PERCENT = 5n;

export function validateValueMock(total: Coins, fee: Coins, percent: bigint): { purified: Coins, opn: Coins } {
    assert(fee < total, "not enough gas");
    const extra = total - fee;
    const purified = extra * (100n - percent) / 100n;
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

export type CreatorPriceConfig = { wlRoundFutJetLimit: Coins, minTonForSaleSuccess: Coins };
// === CREATOR ===
export function getCreatorJettonPrice(
    { wlRoundFutJetLimit, minTonForSaleSuccess }: CreatorPriceConfig
): Coins {
    return wlRoundFutJetLimit * 2n * MAX_WL_ROUND_TON_LIMIT / minTonForSaleSuccess;
}

// Call get config to get the last two values`get_config`
export function getCreatorAmountOut(
    version: GlobalVersions, value: Coins, creatorPriceConfig: CreatorPriceConfig, expectedFee?: Coins
): Coins {
    const { purified } = validateValueMock(value, expectedFee ?? fees[version].creatorBuyout, PURCHASE_FEE_PERCENT);
    const creatorJettonPrice = getCreatorJettonPrice(creatorPriceConfig);
    return purified * creatorJettonPrice / MAX_WL_ROUND_TON_LIMIT;
}

export function getCreatorValueLimit(
    { creatorFutJetLeft, creatorFutJetPriceReversed }: { creatorFutJetLeft: Coins, creatorFutJetPriceReversed: Coins }
): Coins {
    return creatorFutJetLeft * MAX_WL_ROUND_TON_LIMIT / creatorFutJetPriceReversed;
}

export function getExpectedWlValueShare(value: Coins, expectedFee: Coins, withReferral: boolean = false): Coins {
    return validateValueMock(value, expectedFee, PURCHASE_FEE_PERCENT).purified
        * (withReferral ? (100n - REFERRAL_PAYMENT_PERCENT) : 100n) / 100n;
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
    withReferral: boolean = false,
): Coins {
    const { purified } = validateValueMock(value, fees[version].pubPurchase, PURCHASE_FEE_PERCENT);
    return getAmountOutMock(
        !withReferral ? purified : purified * (100n - REFERRAL_PAYMENT_PERCENT) / 100n,
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
    // 20 percent goes to pool so only 80% can be distributed
    return userClaimAmount * rewardPoolSupply / (launchSupply * 8n / 10n);
}

/**
 * Reverts the calculation of the initial invested value from the final value.
 * This function accounts for the possibility of a referral fee (0.95 factor)
 * and a fixed launchpad fee (0.99 factor).
 *
 * @param y - The final value after applying fees.
 * @param haveReferral - A boolean indicating if the referral fee was applied (default: false).
 * @returns The initial invested value before fees were applied.
 *
 * The formula assumes the following operation:
 * y = (x * 0.99) * 0.95 (if haveReferral is true) or y = x * 0.99 (if haveReferral is false).
 */
export function unwrapInitialValue(y: number, haveReferral: boolean = false): number {
    const referralFactor = haveReferral ? 0.95 : 1;
    return y / referralFactor / 0.99;
}