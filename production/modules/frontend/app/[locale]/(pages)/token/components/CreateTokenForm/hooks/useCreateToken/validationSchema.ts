import { YupShape } from "@/types";
import * as Yup from "yup";
import { MASKS } from "@/constants";
import { CreateTokenFormFields, MarketingSupportTabsValues } from "./types";
import {
  DEFAULT_DECIMALS,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MIN_SYMBOL_LENGTH,
  MAX_SYMBOL_LENGTH,
  MIN_TOTAL_SUPPLY_LENGTH,
} from "../../constants";

const testImage = Yup.string()
  .required("Token.imageInput.errors.required");

const testName = Yup.string()
  .required("Token.nameInput.errors.required")
  .min(MIN_NAME_LENGTH, "Token.nameInput.errors.short")
  .max(MAX_NAME_LENGTH, "Token.nameInput.errors.long");

const testDescription = Yup.string()
  .required("Token.descriptionTextarea.errors.required")
  .min(MIN_DESCRIPTION_LENGTH, "Token.descriptionTextarea.errors.short")
  .max(MAX_DESCRIPTION_LENGTH, "Token.descriptionTextarea.errors.long");

const testSymbol = Yup.string()
  .required("Token.symbolInput.errors.required")
  .min(MIN_SYMBOL_LENGTH, "Token.symbolInput.errors.short")
  .max(MAX_SYMBOL_LENGTH, "Token.symbolInput.errors.long");

const testTotalSupply = Yup.string()
  .required("Token.totalSupplyInput.errors.required")
  .test(
    "is-minimum",
    "Token.totalSupplyInput.errors.minimum",
    (value) => value !== undefined && parseFloat(value) >= MIN_TOTAL_SUPPLY_LENGTH
  );

const testUrl = Yup.string()
  .matches(MASKS.url, "Token.urlInput.errors.invalid")
  .nullable();

const testMarketingSupportValue = Yup.mixed<MarketingSupportTabsValues>()
  .oneOf(Object.values(MarketingSupportTabsValues) as MarketingSupportTabsValues[])
  .nullable();

const testBoolean = Yup.boolean();

const testDecimals = Yup.string()
  .oneOf([DEFAULT_DECIMALS], "Token.decimals.errors.invalid")
  .required("Token.decimals.errors.required");

  
export const getValidationSchema = () => {
  const schema: YupShape<CreateTokenFormFields> = {
    x: testUrl,
    telegram: testUrl,
    website: testUrl,
    name: testName,
    description: testDescription,
    symbol: testSymbol,
    image: testImage,
    totalSupply: testTotalSupply,
    marketingSupportValue: testMarketingSupportValue,
    influencerSupport: testBoolean,
    marketingSupportEnabled: testBoolean,
    decimals: testDecimals,
  };
  
  const validationSchema = Yup.object().shape(schema || {});
  return validationSchema;
};
