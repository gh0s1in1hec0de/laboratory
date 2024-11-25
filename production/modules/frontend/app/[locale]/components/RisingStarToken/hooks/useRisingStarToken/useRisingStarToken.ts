import { useState, useEffect , useTransition, MouseEvent } from "react";
import { GetRisingStarResponse } from "starton-periphery";
import { launchService } from "@/services";
import { getErrorText, getErrorStatus } from "@/utils";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useToggle } from "@/hooks";

export function useRisingStarToken() {
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);
  const [tokenData, setTokenData] = useState<GetRisingStarResponse>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const t = useTranslations("Top");
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleRedirectToLaunch(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    
    if (!isOpenDrawer) {
      startTransition(() => {
        router.push(`/${locale}/${tokenData?.address}`);
      });
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await launchService.getRisingStar();
        if (!data) setErrorText(t("risingStarNotFound"));
        setTokenData(data);
      } catch (error) {
        // todo
        if (getErrorStatus(error) === 500) {
          console.log(error);
          // setErrorText(t("risingStarNotReachable"));
        } else {
          setErrorText(getErrorText(error, t("commonError")));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return {
    isLoading,
    errorText,
    tokenData,
    isPending,
    handleRedirectToLaunch,
    isOpenDrawer,
    toggleOpenDrawer,
  };
}
