import { REFERRAL } from "@/constants";
import { getErrorText } from "@/utils/getErrorText";
import { localStorageWrapper } from "@/utils/storageWrapper";
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
          maybeReferral: localStorageWrapper.get(REFERRAL),
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
