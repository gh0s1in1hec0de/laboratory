import { getErrorText } from "@/utils";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { TxRequestBuilder } from "starton-periphery";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { UseBuyTokenProps } from "./types";
import { toNano } from "@ton/core";

export function useBuyToken({ supply, launchAddress }: UseBuyTokenProps) {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>("");
  const [tonConnectUI] = useTonConnectUI();
  const t = useTranslations("Token.currentToken.buyButton");

  const numericAmount = BigInt(amount);
  const isValidAmount = numericAmount > 0 && numericAmount <= (supply ?? 0n) / 4n;

  function getAmountError() {
    const numericAmount = BigInt(amount);
    if (numericAmount < 0) {
      return t("error.negative");
    }

    if (numericAmount > (supply ?? 0n) / 4n) {
      return `${t("error.maxAmount")} (${supply})`;
    }

    return "";
  }

  async function onClickBuyTokens() {
    try {
      setIsLoading(true);

      const transaction = TxRequestBuilder.creatorBuyoutMessage(
        {
          launchAddress: launchAddress,
          amount: toNano(amount).toString(),
        },
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });
    } catch (error) {
      setErrorText(getErrorText(error, t("error.buyingError")));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    amount,
    setAmount,
    onClickBuyTokens,
    isValidAmount,
    getAmountError,
    errorText,
    isLoading,
  };
}
