import { useEffect, useState } from "react";
import { getErrorText } from "@/utils";
import { useTranslations } from "next-intl";
import { launchService } from "@/services/launch";
import { GetCertainLaunchResponse } from "starton-periphery";

export function useCurrentLaunch(address: string) {
  const [launchData, setLaunchData] = useState<GetCertainLaunchResponse>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const t = useTranslations("CurrentLaunch");

  useEffect(() => {
    (async () => {
      try {
        const launchData = await launchService.getCurrentToken({ address });
        setLaunchData(launchData);
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
    getLaunchLink
  };
}
