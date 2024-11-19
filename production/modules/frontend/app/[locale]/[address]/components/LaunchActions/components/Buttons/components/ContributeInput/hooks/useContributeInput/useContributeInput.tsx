import { useState } from "react";
import { useTranslations } from "next-intl";
import { getErrorText } from "@/utils/getErrorText";
import { TxRequestBuilder } from "starton-periphery";
import { toNano } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";

export function useContributeInput(launchAddress: string) {
  const t = useTranslations("CurrentLaunch.contribute.amountInput");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [tonConnectUI] = useTonConnectUI();

  const numericAmount = BigInt(amount);
  const isValidAmount = numericAmount > 0;

  function getAmountError(): string {
    if (numericAmount < 0) {
      return "CurrentLaunch.contribute.amountInput.errors.negative";
    }
    return "";
  }

  async function onClickBuyTokens() {
    try {
      setIsLoading(true);
      
      const transaction = TxRequestBuilder.whitelistPurchaseV1Message(
        {
          launchAddress,
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
    isValidAmount,
    getAmountError,
    isLoading,
    errorText,
    onClickBuyTokens,
  };
}
