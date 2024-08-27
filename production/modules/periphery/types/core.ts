import { Address, Cell, Dictionary, Slice } from "@ton/core";
import { Maybe } from "@ton/ton/dist/utils/maybe";

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

export type Contracts = {
    tokenLaunch: Cell,
    userVault: Cell,
    jettonMaster: Cell,
    jettonWallet: Cell,
}

export type CoreState = {
    chief: Address,
    utilJettonMasterAddress: Address,
    utilJettonWalletAddress: Maybe<Address>,
    utilJetCurBalance: bigint,
    notFundedLaunches: Maybe<Dictionary<Address, Slice>>,
    notFundedLaunchesAmount: number,
    launchConfig: LaunchConfig,
    contracts: Contracts,
};