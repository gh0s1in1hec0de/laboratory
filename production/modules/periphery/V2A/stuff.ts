import { LaunchConfigV2A } from "./types";
import { beginCell, Cell } from "@ton/core";

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