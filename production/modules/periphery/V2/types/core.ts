import { Contracts } from "../../types";
import { Coins } from "../../standards";
import { Address } from "@ton/core";

export type LaunchConfigV2 = {
    minTonForSaleSuccess: Coins,
    tonLimitForWlRound: Coins,
    penny: Coins,

    utilJetMasterAddress: Address,
    utilJetWlPassAmount: Coins,
    utilJetWlPassOneTimePrice: Coins,

    jetWlLimitPct: number,
    jetPubLimitPct: number,
    jetDexSharePct: number,

    creatorRoundDurationSec: number,
    wlRoundDurationSec: number,
    pubRoundDurationSec: number,
};

export type CoreStateV2 = {
    chief: Address,
    launchConfig: LaunchConfigV2,
    contracts: Contracts,
};