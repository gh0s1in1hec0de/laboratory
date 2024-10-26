import { Contracts } from "../../types";
import { Coins } from "../../standards";
import { Address } from "@ton/core";

// TODO
export type LaunchConfigV2 = {
    minTonForSaleSuccess: Coins,
    tonLimitForWlRound: Coins,
    penny: Coins,

    utilJetMasterAddress: Address,
    utilJetWlPassAmount: Coins,
    utilJetWlPassOneTimePriceAmount: Coins,

    jetWlLimitPct: number,
    jetPubLimitPct: number,
    jetDexSharePct: number,

    creatorRoundDurationMs: number,
    wlRoundDurationMs: number,
    pubRoundDurationMs: number,
};

export type CoreStateV2 = {
    chief: Address,
    launchConfig: LaunchConfigV2,
    contracts: Contracts,
};