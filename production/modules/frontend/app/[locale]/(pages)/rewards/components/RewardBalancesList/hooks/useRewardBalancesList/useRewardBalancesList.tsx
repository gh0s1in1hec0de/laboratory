import { CALLER_ADDRESS } from "@/constants";
import { rewardsService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import { Address } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TxRequestBuilder } from "starton-periphery";

export function useRewardBalancesList() {
  const t = useTranslations("Rewards");
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tonConnectUI] = useTonConnectUI();

  async function claimAllRewards() {
    try {
      setIsLoading(true);
      
      const response = await rewardsService.getClaimAllRewards({
        userAddress: localStorageWrapper.get(CALLER_ADDRESS),
        // userAddress: Address.parse("0:2dd16bb9a506382fa6b54ca661e44c3ef40c3bd776088995f94db50a44b44ad2").toRawString(),
      });
      
      const transaction = TxRequestBuilder.claimRewardsMessage(
        {
          dispenserAddress: process.env.NEXT_PUBLIC_DISPENSER_ADDRESS!,
          amount: response,
          mode: "t",
        },
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });
    } catch (error) {
      setErrorText(getErrorText(error, t("claimAllError")));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    claimAllRewards,
    errorText,
    isLoading,
  };
}
