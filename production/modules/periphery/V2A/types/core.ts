import { Contracts } from "../../types";
import { Coins } from "../../standards";
import { Address } from "@ton/core";

export type LaunchConfigV2A = {
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

export type CoreStateV2A = {
    chief: Address,
    launchConfig: LaunchConfigV2A,
    contracts: Contracts,
};