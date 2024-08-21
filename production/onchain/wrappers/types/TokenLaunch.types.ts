import {Address, Cell} from "@ton/core";
import { BalanceUpdateMode, Coins } from "starton-periphery";

export type RefundRequestParams = {
  mode: BalanceUpdateMode,
  refundValue: Coins,
}

export type LaunchDataType = {
  futJetTotalSupply: Coins,
  creatorAddress: Address,
  metadata: Cell,
}
