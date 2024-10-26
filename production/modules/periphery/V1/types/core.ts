import { Contracts } from "../../types";
import { Coins } from "../../standards";
import { Address } from "@ton/core";

export type LaunchConfigV1 = {
    minTonForSaleSuccess: Coins,
    tonLimitForWlRound: Coins,
    penny: Coins,

    jetWlLimitPct: number,
    jetPubLimitPct: number,
    jetDexSharePct: number,

    creatorRoundDurationMs: number,
    wlRoundDurationMs: number,
    pubRoundDurationMs: number,
};

export type CoreStateV1 = {
    chief: Address,
    launchConfig: LaunchConfigV1,
    contracts: Contracts,
};