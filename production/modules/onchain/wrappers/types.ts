import { OnchainMetadataStandard, Coins } from "starton-periphery";
import { Cell } from "@ton/core";

export type LaunchParams = {
    startTime?: number, // Unix timestamp
    totalSupply: bigint,
    platformSharePct: number,
    metadata: Cell | OnchainMetadataStandard,
};

export type UpgradeParams = {
    newData: Cell,
    newCode: Cell,
};