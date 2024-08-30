import { TokenMetadata, Coins } from "starton-periphery";
import { Cell } from "@ton/core";

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