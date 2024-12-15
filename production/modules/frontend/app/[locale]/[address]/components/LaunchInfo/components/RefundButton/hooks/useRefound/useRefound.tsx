import { getErrorText } from "@/utils";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useState } from "react";
import { TxRequestBuilder } from "starton-periphery";
import type { UseRefoundProps } from "./types";
import { useTranslations } from "next-intl";
import { useToggle } from "@/hooks";
import { Address } from "@ton/core";

export function useRefound({
  launchData,
  userAddress,
}: UseRefoundProps) {
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);
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
          launchAddress: Address.parse(launchData.address ?? "").toRawString(),
          isCreator: launchData.creator === userAddress,
        }
      );

      await tonConnectUI.sendTransaction(transaction, { modals: ["error"] });
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
    isOpenDrawer,
    toggleOpenDrawer,
  };
}
