import { Coins, TokenMetadata } from "starton-periphery";
import { Cell } from "@ton/core";

export type CreateLaunchParams = {
    startTime: number, // Unix timestamp
    totalSupply: bigint,
    platformSharePct: number,
    metadata: Cell | TokenMetadata,
};

export type UpgradeParams = {
    newData: Cell,
    newCode: Cell,
};

export type StateType = {
    notFundedLaunches: Cell,
    notFundedLaunchesAmount: number,
    utilJetCurBalance: Coins,
};

export type LaunchConfigType = {
    minTonForSaleSuccess: Coins,
    tonLimitForWlRound: Coins,
    utilJetRewardAmount: Coins,
    utilJetWlPassAmount: Coins,
    utilJetBurnPerWlPassAmount: Coins,
    jetWlLimitPct: number,
    jetPubLimitPct: number,
    jetDexSharePct: number,
    creatorRoundDurationMs: number,
    wlRoundDurationMs: number,
    pubRoundDurationMs: number,
};