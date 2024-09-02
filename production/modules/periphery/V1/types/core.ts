import { Address, Dictionary, Slice } from "@ton/core";
import { Maybe } from "@ton/ton/dist/utils/maybe";
import { Contracts } from "../../types";

export type LaunchConfigV1 = {
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

export type CoreStateV1 = {
    chief: Address,
    utilJettonMasterAddress: Address,
    utilJettonWalletAddress: Maybe<Address>,
    utilJetCurBalance: bigint,
    notFundedLaunches: Maybe<Dictionary<Address, Slice>>,
    notFundedLaunchesAmount: number,
    launchConfig: LaunchConfigV1,
    contracts: Contracts,
};