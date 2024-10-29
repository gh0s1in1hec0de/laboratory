import { OnchainMetadataStandard, Coins, LaunchConfigV1, } from "starton-periphery";
import { beginCell, Cell, Sender } from "@ton/core";

export const CoinsMaxValue = 2n ** 120n - 1n;
export const ThirtyTwoIntMaxValue = 2n ** 31n - 1n; // 1 bit for sign :)

export type SendMessageParams = {
    via: Sender,
    value: Coins,
    queryId: bigint
}


