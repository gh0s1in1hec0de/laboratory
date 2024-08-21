import {Address, Cell, Dictionary} from "@ton/core";
import { Slice } from "@ton/ton";

export type CoreConfig = {
  chief: Address,
  utilJettonMasterAddress: Address,
  utilJettonWalletAddress: Address,
  utilJetCurBalance: bigint,
  notFundedLaunches: Dictionary<Address, Slice> | null,
  notFundedLaunchesAmount: number,
  launchConfig: {
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
  contracts: {
    jettonLaunch: Cell,
    jettonLaunchUserVault: Cell,
    derivedJettonMaster: Cell,
    jettonWallet: Cell,
  };
};

export type CreateLaunchParams = {
  startTime: number, // Unix timestamp
  totalSupply: bigint,
  platformSharePct: number,
  metadata: Cell, // Packed `TEP64JettonMetadata`
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