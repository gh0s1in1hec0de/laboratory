import { ToCorrectAmountProps } from "./types";

export function toCorrectAmount({
  amount,
  fractionDigits = 0,
  locale = "en",
}: ToCorrectAmountProps): string {
  const isInteger = Number.isInteger(amount);

  const formattedAmount = new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU", {
    minimumFractionDigits: isInteger ? 0 : fractionDigits,
    maximumFractionDigits: isInteger ? 0 : fractionDigits,
  }).format(Math.abs(amount));

  return formattedAmount;
}
