import { beginCell, Cell, Sender } from "@ton/core";
import type {
    WhitelistRoundStateV1,
    TokenLaunchStorageV1,
    CreatorRoundStateV1,
    PublicRoundStateV1,
    TokenMetadata,
    GeneralStateV1,
    CoreStateV1,
    SaleConfigV1,
    SaleStateV1,
    Coins,
    ToolsV1,
} from "starton-periphery";

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


