import { getErrorText } from "@/utils";
import { useState, useEffect } from "react";
import { GetRewardPoolsResponse } from "starton-periphery";
import { useTranslations } from "next-intl";
import { rewardsService } from "@/services";

export function useLaunchRewards(address: string) {
  const [rewardsData, setRewardsData] = useState<GetRewardPoolsResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string>();
  const t = useTranslations("CurrentLaunch.rewards");

  useEffect(() => {
    (async () => {
      try {
        const rewardsData = await rewardsService.getRewardPools({
          tokenLaunches: [address]
        });
        setRewardsData(rewardsData);
      } catch (error) {
        setErrorText(getErrorText(error, t("fetchError")));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return {
    rewardsData,
    isLoading,
    errorText
  };
}
