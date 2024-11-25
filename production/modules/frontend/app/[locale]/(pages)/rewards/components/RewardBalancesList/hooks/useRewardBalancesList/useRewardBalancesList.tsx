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
        userAddress: Address.parse(localStorageWrapper.get(CALLER_ADDRESS)).toRawString(),
        // userAddress: Address.parse("0:062c4f50c92ab0927d58347e0e2105c10e0e6156f267d4cec530ecc9e25da9f1").toRawString(),
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
