import {
  Caller,
  GetRewardJettonBalancesResponse,
  GetRewardPoolsResponse,
  GetUserBalancesResponse
} from "starton-periphery";
import { rewardsService, userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
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
  const [callerData, setCallerData] = useState<Caller | null>(null);
  // const t = useTranslations("Rewards");

  async function fetchClaims() {
    const creator = localStorageWrapper.get(CALLER_ADDRESS);

    try {
      const callerData = await userService.getCaller(creator);
      setCallerData(callerData);

      const response = await userService.getBalances({
        user: Address.parse(creator).toRawString(),
        // user: Address.parse("0:264c72e581e5f8481be5c3b169bd2c1e61950d2f72086d241426849e1ebfe4c5").toRawString(),
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
      console.error("Error in fetch balances and pools:", error);
      // setErrorText(getErrorText(error, t("fetchingError")));
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRewards() {
    try {
      const response = await rewardsService.getRewardBalances({
        userAddress: Address.parse(localStorageWrapper.get(CALLER_ADDRESS)).toRawString(),
        // userAddress: Address.parse("0:264c72e581e5f8481be5c3b169bd2c1e61950d2f72086d241426849e1ebfe4c5").toRawString(),
      });

      setRewardBalances(response);
    } catch (error) {
      console.error("Error in fetch rewards:", error);
      // setErrorText(getErrorText(error, t("fetchingError")));
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
    callerData,
  };
}
