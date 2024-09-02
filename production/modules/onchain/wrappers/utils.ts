import { TokenMetadata, Coins, LaunchConfigV2A, } from "starton-periphery";
import { beginCell, Cell, Sender } from "@ton/core";

export const CoinsMaxValue = 2n ** 120n - 1n;
export const ThirtyTwoIntMaxValue = 2n ** 31n - 1n; // 1 bit for sign :)

export type SendMessageParams = {
    via: Sender,
    value: Coins,
    queryId: bigint
}

// Duplicate of starton periphery function as blueprint does not work properly with imported one at some reason
export function tokenMetadataToCell(content: TokenMetadata): Cell {
    return beginCell()
        .storeStringRefTail(content.uri) // Snake logic under the hood
        .endCell();
}

export function packLaunchConfigToCellV2A(c: LaunchConfigV2A): Cell {
    return beginCell()
        .storeCoins(c.minTonForSaleSuccess)
        .storeCoins(c.tonLimitForWlRound)
        .storeCoins(c.penny)

        .storeUint(c.jetWlLimitPct, 16)
        .storeUint(c.jetPubLimitPct, 16)
        .storeUint(c.jetDexSharePct, 16)

        .storeInt(c.creatorRoundDurationMs, 32)
        .storeInt(c.wlRoundDurationMs, 32)
        .storeInt(c.pubRoundDurationMs, 32)
        .endCell();
}


