import {
  GetRewardJettonBalancesResponse,
  GetRewardPoolsResponse,
  GetUserBalancesResponse
} from "starton-periphery";
import { rewardsService, userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RewardsTabsValues } from "../../types";
import { UseRewardsListProps } from "./types";
import { CALLER_ADDRESS } from "@/constants";
import { Address } from "@ton/core";

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
        user: Address.parse(localStorageWrapper.get(CALLER_ADDRESS)).toRawString(),
        // user: "0:90713b498b124c68028f71ac1b94a9ec5c32e09778e419e344ad370734d3a177",
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
        userAddress: Address.parse(localStorageWrapper.get(CALLER_ADDRESS)).toRawString(),
        // userAddress: Address.parse("0:90713b498b124c68028f71ac1b94a9ec5c32e09778e419e344ad370734d3a177").toRawString(),
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
