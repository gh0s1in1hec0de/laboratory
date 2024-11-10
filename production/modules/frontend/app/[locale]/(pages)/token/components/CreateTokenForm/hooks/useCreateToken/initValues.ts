import { CreateTokenFormFields, MarketingSupportTabsValues } from "./types";

export const initialValues: CreateTokenFormFields = {
  x: "",
  telegram: "",
  website: "",
  name: "",
  description: "",
  symbol: "",
  decimals: "6",
  image: "",
  influencerSupport: false,
  totalSupply: "",
  marketingSupportEnabled: false,
  marketingSupportValue: MarketingSupportTabsValues.LOW,
};
