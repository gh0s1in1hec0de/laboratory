import { PAGES } from "@/constants";
import { LAUNCH_ERROR } from "@/errors";
import { launchService } from "@/services";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExtendedLaunch } from "starton-periphery";

export function useTokenPolling() {
  const [launchData, setLaunchData] = useState<ExtendedLaunch>();
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
        pollingToken(creator, undefined);
      } else if (meta) {
        pollingToken(undefined, meta);
      } else {
        router.push(`/${locale}/${PAGES.Token}`);
      }
    })();
  }, []);

  return { launchData, isLoading };
}
