import { Coins, TokenMetadata } from "starton-periphery";
import { Address, Cell } from "@ton/core";

export type LaunchParams = {
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