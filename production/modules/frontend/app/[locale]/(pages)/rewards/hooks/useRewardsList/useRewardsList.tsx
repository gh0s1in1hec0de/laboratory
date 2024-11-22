import { 
  GetRewardPoolsResponse, 
  GetUserBalancesResponse, 
  GetRewardJettonBalancesResponse 
} from "starton-periphery";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getErrorText, localStorageWrapper } from "@/utils";
import { userService, rewardsService } from "@/services";
import { CALLER_ADDRESS } from "@/constants";
import { RewardsTabsValues } from "../../types";
import { UseRewardsListProps } from "./types";

export function useRewardsList({ selectedTab }: UseRewardsListProps) {
  const [rewardBalances, setRewardBalances] = useState<GetRewardJettonBalancesResponse>(null);
  const [extendedBalances, setExtendedBalances] = useState<GetUserBalancesResponse>(null);
  const [rewardPools, setRewardPools] = useState<GetRewardPoolsResponse>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const t = useTranslations("Rewards");

  async function fetchClaims() {
    try {
      const response = await userService.getBalances({
        // user: localStorageWrapper.get(CALLER_ADDRESS),
        user: "0:2dd16bb9a506382fa6b54ca661e44c3ef40c3bd776088995f94db50a44b44ad2",
      });

      if (!response) {
        return;
      }

      setExtendedBalances(response);

      const rewardPools = await rewardsService.getRewardPools({
        tokenLaunches: Object.keys(response),
      });

      setRewardPools(rewardPools);
    } catch (error) {
      setErrorText(getErrorText(error, t("fetchingError")));
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRewards() {
    try {
      const response = await rewardsService.getRewardBalances({
        // user: localStorageWrapper.get(CALLER_ADDRESS),
        userAddress: "0:2dd16bb9a506382fa6b54ca661e44c3ef40c3bd776088995f94db50a44b44ad2",
      });

      setRewardBalances(response);
    } catch (error) {
      setErrorText(getErrorText(error, t("fetchingError")));
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    (async () => {
      if (selectedTab === RewardsTabsValues.CLAIMS) {
        await fetchClaims();
      }

      if (selectedTab === RewardsTabsValues.REWARDS) {
        await fetchRewards();
      }
    })();
  }, [selectedTab]);

  return { 
    rewardBalances,
    extendedBalances,
    isLoading,
    errorText,
    rewardPools,
  };
}
