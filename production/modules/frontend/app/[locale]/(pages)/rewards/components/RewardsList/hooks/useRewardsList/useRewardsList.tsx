import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getErrorText, localStorageWrapper } from "@/utils";
import { userService } from "@/services";
import { CALLER_ADDRESS } from "@/constants";
import { GetUserBalancesResponse } from "starton-periphery";

export function useRewardsList() {
  const [balances, setBalances] = useState<GetUserBalancesResponse>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const t = useTranslations("Rewards");

  useEffect(() => {
    (async () => {
      try {
        const balances = await userService.getBalances({
          // user: localStorageWrapper.get(CALLER_ADDRESS),
          user: "0:1eb8e4e683f52de193a414eb9e823fe10ba440a8a28a1fe8fa19897d4b422bfa",
        });

        setBalances(balances);
      } catch (error) {
        setErrorText(getErrorText(error, t("fetchingError")));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { 
    balances,
    isLoading,
    errorText,
  };
}
