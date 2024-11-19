import { PAGES } from "@/constants";
import { LAUNCH_ERROR } from "@/errors";
import { launchService } from "@/services";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExtendedLaunch, getCurrentSalePhase, SalePhase } from "starton-periphery";

export function useTokenPolling() {
  const [launchData, setLaunchData] = useState<ExtendedLaunch>();
  const [isLaunchCreated, setIsLaunchCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const creator = searchParams.get("creator");
  const meta = searchParams.get("meta");
  const router = useRouter();
  const locale = useLocale();

  async function pollingToken(creator?: string, metadataUri?: string) {
    try {
      while (!launchData) {
        const data = await launchService.getCurrentToken({ creator, metadataUri });
        
        if (data) {
          setLaunchData(data);

          const { phase, nextPhaseIn } = getCurrentSalePhase(data.timings);

          if (phase === SalePhase.NOT_STARTED && nextPhaseIn) {
            setIsLaunchCreated(true);
            await new Promise((resolve) => setTimeout(resolve, nextPhaseIn));
            setIsLaunchCreated(false);
          }

          setIsLoading(false);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(LAUNCH_ERROR.PollingTokenLaunch, error);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      if (creator) {
        await pollingToken(creator, undefined);
      } else if (meta) {
        await pollingToken(undefined, meta);
      } else {
        router.replace(`/${locale}/${PAGES.Token}`);
      }
    })();
  }, []);

  return { 
    launchData, 
    isLoading,
    isLaunchCreated
  };
}
