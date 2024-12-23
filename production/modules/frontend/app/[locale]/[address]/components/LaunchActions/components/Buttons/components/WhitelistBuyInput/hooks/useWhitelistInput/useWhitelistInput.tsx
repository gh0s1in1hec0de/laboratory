import { CALLER_ADDRESS } from "@/constants";
import { launchService, userService } from "@/services";
import { localStorageWrapper } from "@/utils";
import { getErrorText } from "@/utils/getErrorText";
import { Address, toNano } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Caller, TxRequestBuilder } from "starton-periphery";

export function useWhitelistInput(launchAddress: string, callerData: Caller | null) {
  const t = useTranslations("CurrentLaunch.contribute.amountInput");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [tonConnectUI] = useTonConnectUI();
  
  async function onClickBuyTokens() {
    try {
      setIsLoading(true);

      const whitelistStatus = await userService.getWhitelistStatus({
        callerAddress: localStorageWrapper.get(CALLER_ADDRESS),
        tokenLaunch: launchAddress,
      });

      const ticketBalance = await userService.getTicketBalance();

      if (!whitelistStatus && ticketBalance > 0) {
        await launchService.postBuyWl({
          callerAddress: localStorageWrapper.get(CALLER_ADDRESS),
          launchAddress: Address.parse(launchAddress).toRawString(),
        });
      }

      const transaction = TxRequestBuilder.whitelistPurchaseV1Message(
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
