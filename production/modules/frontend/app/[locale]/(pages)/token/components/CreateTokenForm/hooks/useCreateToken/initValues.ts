import { CreateTokenFormFields, MarketingSupportTabsValues } from "./types";
import { DEFAULT_DECIMALS } from "../../constants";

export const initialValues: CreateTokenFormFields = {
  x: "",
  telegram: "",
  website: "",
  name: "",
  description: "",
  symbol: "",
  decimals: DEFAULT_DECIMALS,
  image: "",
  influencerSupport: false,
  totalSupply: "",
  marketingSupportEnabled: false,
  marketingSupportValue: MarketingSupportTabsValues.LOW,
};
