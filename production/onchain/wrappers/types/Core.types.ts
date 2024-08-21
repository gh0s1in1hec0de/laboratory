import { Address, Cell, Dictionary } from "@ton/core";
import { TokenMetadata } from "starton-periphery";
import { Slice } from "@ton/ton";

export type CreateLaunchParams = {
    startTime: number, // Unix timestamp
    totalSupply: bigint,
    platformSharePct: number,
    metadata: Cell | TokenMetadata,
};

export type UpgradeParams = {
    newData: Cell,
    newCode: Cell,
}

export type StateType = {
    notFundedLaunches: Cell,
    notFundedLaunchesAmount: bigint,
    utilJetCurBalance: bigint,
}

export type LaunchConfigType = {
    minTonForSaleSuccess: bigint,
    tonLimitForWlRound: bigint,
    utilJetRewardAmount: bigint,
    utilJetWlPassAmount: bigint,
    utilJetBurnPerWlPassAmount: bigint,
    jetWlLimitPct: bigint,
    jetPubLimitPct: bigint,
    jetDexSharePct: bigint,
    creatorRoundDurationMs: bigint,
    wlRoundDurationMs: bigint,
    pubRoundDurationMs: bigint,
}