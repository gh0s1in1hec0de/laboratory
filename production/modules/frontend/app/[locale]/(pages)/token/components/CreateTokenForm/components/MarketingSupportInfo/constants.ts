import { MarketingSupportTabsValues } from "../../hooks/useCreateToken";
import { MarketingSupportTab } from "./types";

export const MARKETING_SUPPORT_TABS: MarketingSupportTab[] = [
  {
    label: "Token.marketingSupportCheckbox.tabs.first",
    value: MarketingSupportTabsValues.LOW,
  },
  {
    label: "Token.marketingSupportCheckbox.tabs.second",
    value: MarketingSupportTabsValues.HIGH,
  },
];
