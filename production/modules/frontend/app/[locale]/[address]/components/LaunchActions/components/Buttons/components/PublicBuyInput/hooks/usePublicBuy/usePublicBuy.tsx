import { getErrorText } from "@/utils/getErrorText";
import { toNano } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TxRequestBuilder } from "starton-periphery";

export function usePublicBuy(launchAddress: string){
  const t = useTranslations("CurrentLaunch.contribute.amountInput");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [tonConnectUI] = useTonConnectUI();

  async function onClickBuyTokens() {
    try {
      setIsLoading(true);
      const transaction = TxRequestBuilder.publicPurchaseMessage(
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
    isLoading,
    errorText,
    onClickBuyTokens,
  };
}
