import { GetConfigResponse, MoneyFlows } from "./types"
import { ok as assert } from "assert";
import { Coins } from "./standards";
import { toNano } from "@ton/core";

// 10k TON
export const MAX_WL_ROUND_TON_LIMIT = 10000n * toNano("1");
export const PERCENTAGE_DENOMINATOR = 100000n;

export function validateValue(total: Coins, fee: Coins): { purified: Coins, opn: Coins } {
    assert(!(fee > total), "not enough gas");
    const extra = total - fee;
    const purified = extra * 99n / 100n;
    assert(purified > 0, "balance lack");
    return { purified, opn: extra - purified };
}

export function getCreatorJettonPrice(wlJetLimit: Coins, tonLimitForWlRound: Coins): Coins {
    return wlJetLimit * 2n * MAX_WL_ROUND_TON_LIMIT / tonLimitForWlRound;
}

export function getCreatorAmountOut(expectedFee: Coins, value: Coins, wlJetLimit: Coins, tonLimitForWlRound: Coins): Coins {
    const { purified } = validateValue(value, expectedFee);
    const creatorJettonPrice = getCreatorJettonPrice(wlJetLimit, tonLimitForWlRound);
    return purified * creatorJettonPrice / MAX_WL_ROUND_TON_LIMIT;
}

export function getAmountOut(amountIn: Coins, reserveIn: Coins, reserveOut: Coins): Coins {
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = reserveIn * reserveOut / newReserveIn;
    const amountOut = reserveOut - newReserveOut;
    assert(amountOut > 0, "amount out must be positive");
    return amountOut;
}

export function getApproximateClaimAmount(
    moneyFlows: MoneyFlows,
    config: GetConfigResponse,
    share: { wlTons: Coins, jettons: Coins },
    isCreator: boolean = false
) {
    let futJetRecipientTotalAmount = share.jettons;
    if (share.wlTons > 0) {
        const publicRemainings = config.pubRoundFutJetLimit - moneyFlows.publicRoundFutJetSold;
        const wlRoundFurJetFinalAmount = config.wlRoundFutJetLimit + publicRemainings;

        const jettonWlShare = wlRoundFurJetFinalAmount * share.wlTons / moneyFlows.wlRoundTonInvestedTotal;
        futJetRecipientTotalAmount += jettonWlShare;
    }
    if (isCreator) futJetRecipientTotalAmount += moneyFlows.creatorFutJetBalance;
    return futJetRecipientTotalAmount;
}