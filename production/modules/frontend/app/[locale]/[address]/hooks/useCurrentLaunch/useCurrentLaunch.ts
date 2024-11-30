import { useEffect, useState } from "react";
import { getErrorText, localStorageWrapper } from "@/utils";
import { useTranslations } from "next-intl";
import { launchService } from "@/services/launch";
import { GetCertainLaunchResponse, GetUserBalancesResponse } from "starton-periphery";
import { userService } from "@/services/user";
import { CALLER_ADDRESS } from "@/constants";

export function useCurrentLaunch(address: string) {
  const [balance, setBalance] = useState<GetUserBalancesResponse>(null);
  const [launchData, setLaunchData] = useState<GetCertainLaunchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const t = useTranslations("CurrentLaunch");

  async function getBalance() {
    try {
      const response = await userService.getBalances({
        user: localStorageWrapper.get(CALLER_ADDRESS) || "",
        launch: address
      });

      setBalance(response);
    } catch (error) {
      console.log("Error while getting balance:", error);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const launchData = await launchService.getCurrentToken({ address });

        if (!launchData) {
          setErrorText(t("noLaunchError"));
        }

        setLaunchData(launchData);

        await getBalance();
      } catch (error) {
        setErrorText(getErrorText(error, t("fetchError")));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function getLaunchLink() {
    try {
      const currentUrl = window.location.href;
  
      navigator.clipboard.writeText(currentUrl).then(() => {
        console.log("URL copied to clipboard:", currentUrl);
      }).catch((err) => {
        console.error("Failed to copy URL to clipboard:", err);
      });
    } catch (error) {
      console.error("An error occurred while copying the URL:", error);
    }
  }

  return {
    launchData,
    isLoading,
    errorText,
    getLaunchLink,
    balance
  };
}
