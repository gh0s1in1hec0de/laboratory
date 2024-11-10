import { MarketingSupportTabsValues } from "../../hooks/useCreateToken";
import { MarketingSupportTab } from "./types";

export const MARKETING_SUPPORT_TABS: MarketingSupportTab[] = [
  {
    label: "0,5%",
    value: MarketingSupportTabsValues.LOW,
  },
  {
    label: "1,5%",
    value: MarketingSupportTabsValues.HIGH,
  },
];
