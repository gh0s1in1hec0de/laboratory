import { getErrorText } from "@/utils/getErrorText";
import { toNano } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Caller, TxRequestBuilder } from "starton-periphery";

export function usePublicBuy(launchAddress: string, callerData: Caller | null) {
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
          maybeReferral: callerData?.invitedBy || undefined,
        },
      );
      await tonConnectUI.sendTransaction(transaction, { modals: ["error"] });
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
