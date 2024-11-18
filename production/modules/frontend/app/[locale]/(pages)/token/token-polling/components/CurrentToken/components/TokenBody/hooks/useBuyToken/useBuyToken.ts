import { getErrorText } from "@/utils";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getAmountOut, getCurrentSalePhase, GlobalVersions, SalePhase, TxRequestBuilder } from "starton-periphery";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { UseBuyTokenProps } from "./types";
import { fromNano, toNano } from "@ton/core";

export function useBuyToken({ supply, launchAddress, timings }: UseBuyTokenProps) {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>("");
  const [tonConnectUI] = useTonConnectUI();
  const t = useTranslations("Token.currentToken.amountInput");

  const numericAmount = BigInt(amount);
  const isValidAmount = numericAmount > 0;

  const receivedNanoJettons = getAmountOut(
    GlobalVersions.V1,
    SalePhase.CREATOR,
    { wlRoundFutJetLimit: 1n, wlRoundTonLimit: 1n },
    toNano(10),
  );

  const jettonAmount = (BigInt(fromNano(supply)) * BigInt(25) / BigInt(100)) * toNano(10) / BigInt(receivedNanoJettons);
  
  console.log("jettonAmount", jettonAmount);

  function getAmountError(): string {
    if (numericAmount < 0) {
      return "Token.currentToken.amountInput.errors.negative";
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
      setErrorText(getErrorText(error, t("errors.buyingError")));
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
