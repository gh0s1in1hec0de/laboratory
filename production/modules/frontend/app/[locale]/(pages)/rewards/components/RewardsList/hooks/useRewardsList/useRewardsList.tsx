import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getErrorText, localStorageWrapper } from "@/utils";
import { userService } from "@/services";
import { CALLER_ADDRESS } from "@/constants";
import { GetUserBalancesResponse } from "starton-periphery";

export function useRewardsList() {
  const [extendedBalances, setExtendedBalances] = useState<GetUserBalancesResponse>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const t = useTranslations("Rewards");

  useEffect(() => {
    (async () => {
      try {
        const extendedBalancesResponse = await userService.getBalances({
          // user: localStorageWrapper.get(CALLER_ADDRESS),
          user: "0:b8f37554f0de7ea3a0e3b4a19c5f9cf01167e4888785b8c38fa5bd6e9eba0a38",
        });

        setExtendedBalances(extendedBalancesResponse);
      } catch (error) {
        setErrorText(getErrorText(error, t("fetchingError")));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { 
    extendedBalances,
    isLoading,
    errorText,
  };
}
