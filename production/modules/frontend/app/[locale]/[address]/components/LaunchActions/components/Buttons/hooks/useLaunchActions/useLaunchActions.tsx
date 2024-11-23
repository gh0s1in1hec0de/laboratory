import { launchService, userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { GetCertainLaunchResponse, getCurrentSalePhase, SalePhase, TokenLaunchTimings } from "starton-periphery";
import { CALLER_ADDRESS } from "@/constants";
import { ContributeInput } from "../../components/ContributeInput";
import { GetTicketsButton } from "../../components/GetTicketsButton";
import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";

export function useLaunchActions(launchData: GetCertainLaunchResponse) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [whitelistStatus, setWhitelistStatus] = useState<boolean | null>(null);
  const [ticketBalance, setTicketBalance] = useState<number | null>(null);
  const t = useTranslations("CurrentLaunch.contribute");

  const { phase } = getCurrentSalePhase(launchData?.timings as TokenLaunchTimings);

  useEffect(() => {
    (async () => {
      try {
        const callerAddress = localStorageWrapper.get(CALLER_ADDRESS);

        const whitelistStatus = await userService.getWhitelistStatus({
          callerAddress,
          tokenLaunch: launchData?.address ?? "",
        });
        setWhitelistStatus(whitelistStatus);

        if (whitelistStatus) {
          return;
        }

        const ticketBalance = await userService.getTicketBalance();
        setTicketBalance(ticketBalance);

        if (ticketBalance > 0) {
          await launchService.postBuyWl({
            callerAddress,
            launchAddress: launchData?.address ?? "",
          });
          return;
        }
      } catch (error) {
        setErrorText(getErrorText(error, t("fetchError")));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function renderContent() {
    if (phase === SalePhase.WHITELIST || phase === SalePhase.PUBLIC) {
      return (
        <ContributeInput
          launchAddress={launchData?.address ?? ""}
          timings={launchData?.timings as TokenLaunchTimings}
        />
      );
    }

    if (phase === SalePhase.ENDED) {
      if (launchData?.isSuccessful === null) {
        return (
          <CustomButton
            fullWidth
            padding="10px"
            background="gray"
            addHover={false}
          >
            <Label
              label={t("listingInProgress")}
              variantSize="regular16"
            />
          </CustomButton>
        );
      }

      if(launchData?.totalTonsCollected > launchData?.totalTonsTreshold) {
        Deploying jetton...
      } else {
        Страница рефанда
      }
    }
  }

  return {
    isLoading,
    errorText,
    whitelistStatus,
    ticketBalance,
    phase,
    renderContent,
  };
}
