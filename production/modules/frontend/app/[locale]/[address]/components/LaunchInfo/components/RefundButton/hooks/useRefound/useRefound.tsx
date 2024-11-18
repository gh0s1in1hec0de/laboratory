import { getErrorText } from "@/utils";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useState } from "react";
import { TxRequestBuilder } from "starton-periphery";
import type { UseRefoundProps } from "./types";
import { useTranslations } from "next-intl";

export function useRefound({
  launchData,
  userAddress,
}: UseRefoundProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const [errorText, setErrorText] = useState<string>("");
  const t = useTranslations("CurrentLaunch.info.refundButton");
  
  async function onClickRefund() {
    if (!launchData) return;

    try {
      setIsLoading(true);

      const transaction = TxRequestBuilder.refundMessage(
        launchData.version,
        {
          launchAddress: launchData.address,
          isCreator: launchData.creator === userAddress,
        }
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });
    } catch (error) {
      setErrorText(getErrorText(error, t("error")));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    onClickRefund,
    isLoading,
    errorText,
  };
}
