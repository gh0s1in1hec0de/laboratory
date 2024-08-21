import { Address, Cell, Dictionary, Slice } from "@ton/core";

export type LaunchConfig = {
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
    claimDurationMs: number,
};

export type CoreStorage = {
    chief: Address,
    utilJettonMasterAddress: Address,
    utilJettonWalletAddress: Address | null,
    utilJetCurBalance: bigint,
    notFundedLaunches: Dictionary<Address, Slice> | null,
    notFundedLaunchesAmount: number,
    launchConfig: LaunchConfig,
    contracts: {
        jettonLaunch: Cell,
        jettonLaunchUserVault: Cell,
        derivedJettonMaster: Cell,
        jettonWallet: Cell,
    };
};