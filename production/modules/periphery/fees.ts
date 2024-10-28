import { Coins, GlobalVersions } from "./standards";

export const JETTON_MIN_TRANSFER_FEE = 50000000n;

type PrecalculatedFees = {
    creatorBuyout: Coins;
    creatorRefund: Coins;
    wlPurchase: Coins;
    pubPurchase: Coins;
    refund: Coins;
};

// Define the fees object with specific types for each version
export const fees: Record<GlobalVersions, PrecalculatedFees> = {
    [GlobalVersions.V1]: {
        creatorBuyout: 5575200n,
        creatorRefund: 10000000n,
        wlPurchase: 17000000n,
        pubPurchase: 17000000n,
        refund: 30000000n,
    },
    [GlobalVersions.V2]: {
        creatorBuyout: 5699600n,
        creatorRefund: 6203600n,
        wlPurchase: 125767625n,
        pubPurchase: 17841625n,
        refund: 30000000n,
    }
};


