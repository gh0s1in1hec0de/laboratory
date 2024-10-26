import { Address, Dictionary, type Slice } from "@ton/core";
import { Maybe } from "@ton/ton/dist/utils/maybe";
import { Contracts } from "../../types";

export type LaunchConfigDeprecated = {
    minTonForSaleSuccess: bigint,
    tonLimitForWlRound: bigint,
    utilJetRewardAmount: bigint,
    utilJetWlPassAmount: bigint,
    utilJetBurnPerWlPassAmount: bigint,

    jetWlLimitPct: number,
    jetPubLimitPct: number,
    jetDexSharePct: number,

    creatorRoundDurationMs: number,
    wlRoundDurationMs: number,
    pubRoundDurationMs: number,
};

export type DeprecatedCoreState = {
    chief: Address,
    utilJettonMasterAddress: Address,
    utilJettonWalletAddress: Maybe<Address>,
    utilJetCurBalance: bigint,
    notFundedLaunches: Maybe<Dictionary<Address, Slice>>,
    notFundedLaunchesAmount: number,
    launchConfig: LaunchConfigDeprecated,
    contracts: Contracts,
};