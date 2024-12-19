import { Coins, GlobalVersions } from "./standards";

export const JETTON_MIN_TRANSFER_FEE = 50_000_000n;

export type PrecalculatedFees = {
    creatorBuyout: Coins;
    creatorRefund: Coins;
    wlPurchase: Coins;
    pubPurchase: Coins;
    refund: Coins;
    claim: Coins;
};

// Define the fees object with specific types for each version
export const fees: Record<GlobalVersions, PrecalculatedFees> = {
    [GlobalVersions.V1]: {
        creatorBuyout: 5_552_000n,
        creatorRefund: 10_000_000n,
        wlPurchase: 18_000_000n,
        pubPurchase: 18_050_000n,
        refund: 30_000_000n,
        claim: 80_000_000n
    },
    [GlobalVersions.V2]: {
        creatorBuyout: 5_699_600n,
        creatorRefund: 6_203_600n,
        wlPurchase: 125_767_625n,
        pubPurchase: 17_841_625n,
        refund: 30_000_000n,
        claim: 80_000_000n
    }
};


