import { GetConfigResponse, MoneyFlows } from "../types";
import { Coins } from "../standards";
import { ok as assert } from "assert";
import { toNano } from "@ton/core";

// 10k TON
export const MAX_WL_ROUND_TON_LIMIT = 10000n * toNano("1");
export const PERCENTAGE_DENOMINATOR = 100000n;

// TODO Just a reminder - all the fee values should be updated before production

// Mock function, that will help to pre-calculate operations' results on frontend etc

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

export type WlPhaseLimits = {
    wlRoundFutJetLimit: Coins,
    wlRoundTonLimit: Coins
}

// === CREATOR ===
export function getCreatorJettonPrice({ wlRoundFutJetLimit, wlRoundTonLimit }: WlPhaseLimits): Coins {
    return wlRoundFutJetLimit * 2n * MAX_WL_ROUND_TON_LIMIT / wlRoundTonLimit;
}

// Call get config to get the last two values`get_config`
export function getCreatorAmountOut(value: Coins, WlPhaseLimits: WlPhaseLimits, expectedFee: Coins = 5575200n): Coins {
    const { purified } = validateValueMock(value, expectedFee);
    const creatorJettonPrice = getCreatorJettonPrice(WlPhaseLimits);
    return purified * creatorJettonPrice / MAX_WL_ROUND_TON_LIMIT;
}

export function getCreatorValueLimit({ creatorFutJetLeft, creatorFutJetPriceReversed }: { creatorFutJetLeft: Coins, creatorFutJetPriceReversed: Coins }) {
    return creatorFutJetLeft * MAX_WL_ROUND_TON_LIMIT / creatorFutJetPriceReversed;
}

export function getExpectedWlValueShare(value: Coins, expectedFee: Coins = 17000000n): Coins {
    return validateValueMock(value, expectedFee).purified;
}

export function getApproximateWlAmountOut({
    wlRoundFutJetLimit,
    wlRoundTonLimit
}: WlPhaseLimits, value: Coins = toNano("10")): Coins {
    const purifiedValue = getExpectedWlValueShare(value);
    return purifiedValue * wlRoundFutJetLimit / wlRoundTonLimit;
}

// Call get config to get the last two values`get_config`
export type SyntheticReserves = {
    syntheticTonReserve: Coins,
    syntheticJetReserve: Coins
}

export function getPublicAmountOut(
    reserves: SyntheticReserves,
    value: Coins = toNano("10"),
    expectedFee: Coins = 17000000n
): Coins {
    const { purified } = validateValueMock(value, expectedFee);
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