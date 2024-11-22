import { useState } from "react";
import { useTranslations } from "next-intl";
import { getErrorText } from "@/utils/getErrorText";
import { SalePhase, TxRequestBuilder, TokenLaunchTimings, getCurrentSalePhase } from "starton-periphery";
import { toNano } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";

export function useContributeInput(launchAddress: string, timings: TokenLaunchTimings) {
  const t = useTranslations("CurrentLaunch.contribute.amountInput");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [tonConnectUI] = useTonConnectUI();

  const { phase } = getCurrentSalePhase(timings);

  async function onClickBuyTokens() {
    try {
      setIsLoading(true);
      if (phase === SalePhase.WHITELIST) {
        const transaction = TxRequestBuilder.whitelistPurchaseV1Message(
          {
            launchAddress,
            amount: toNano(amount).toString(),
          },
        );
        await tonConnectUI.sendTransaction(transaction, { modals: "all" });
      }

      if (phase === SalePhase.PUBLIC) {
        const transaction = TxRequestBuilder.publicPurchaseMessage(
          {
            launchAddress,
            amount: toNano(amount).toString(),
          },
        );
        await tonConnectUI.sendTransaction(transaction, { modals: "all" });
      }
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
    phase
  };
}
