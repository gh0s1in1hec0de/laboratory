import { useState, useEffect } from "react";
import { GetRisingStarResponse } from "starton-periphery";
import { launchService } from "@/services";
import { getErrorText, getErrorStatus } from "@/utils";
import { useTranslations } from "next-intl";

export function useRisingStarToken() {
  const [tokenData, setTokenData] = useState<GetRisingStarResponse>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const t = useTranslations("Top");

  useEffect(() => {
    (async () => {
      try {
        const data = await launchService.getRisingStar();
        if (!data) setErrorText(t("risingStarNotFound"));
        setTokenData(data);
      } catch (error) {
        if (getErrorStatus(error) === 500) {
          setErrorText(t("risingStarNotReachable"));
        } else {
          setErrorText(getErrorText(error, t("risingStarError")));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return {
    isLoading,
    errorText,
    tokenData
  };
}
