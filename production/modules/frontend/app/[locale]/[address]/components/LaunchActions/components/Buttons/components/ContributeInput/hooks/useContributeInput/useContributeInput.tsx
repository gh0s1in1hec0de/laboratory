import { useState } from "react";
import { useTranslations } from "next-intl";
import { getErrorText } from "@/utils/getErrorText";
import { SalePhase, TxRequestBuilder, TokenLaunchTimings, getCurrentSalePhase } from "starton-periphery";
import { toNano } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";

export function useContributeInput(launchAddress: string, isWhitelist: boolean, isPublic: boolean) {
  const t = useTranslations("CurrentLaunch.contribute.amountInput");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [tonConnectUI] = useTonConnectUI();

  async function onClickBuyTokens() {
    try {
      setIsLoading(true);
      if (isWhitelist) {
        const transaction = TxRequestBuilder.whitelistPurchaseV1Message(
          {
            launchAddress,
            amount: toNano(amount).toString(),
          },
        );
        await tonConnectUI.sendTransaction(transaction, { modals: "all" });
        return;
      }

      if (isPublic) {
        const transaction = TxRequestBuilder.publicPurchaseMessage(
          {
            launchAddress,
            amount: toNano(amount).toString(),
          },
        );
        await tonConnectUI.sendTransaction(transaction, { modals: "all" });
        return;
      }

      return;
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
