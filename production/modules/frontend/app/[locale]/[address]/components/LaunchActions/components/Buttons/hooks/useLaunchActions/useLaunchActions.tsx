import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { CALLER_ADDRESS } from "@/constants";
import { ArrowUpRightIcon } from "@/icons";
import { userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import Grid from "@mui/material/Grid2";
import { Address } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  GetCertainLaunchResponse,
  getCurrentSalePhase,
  GlobalVersions,
  SalePhase,
  TokenLaunchTimings,
  TxRequestBuilder,
} from "starton-periphery";
import { WhitelistBuyInput } from "../../components/WhitelistBuyInput";
import { PublicBuyInput } from "../../components/PublicBuyInput";
import { GetTicketsButton } from "../../components/GetTicketsButton";

export function useLaunchActions(launchData: GetCertainLaunchResponse) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [whitelistStatus, setWhitelistStatus] = useState<boolean | null>(null);
  const [ticketBalance, setTicketBalance] = useState<number | null>(null);
  const [tonConnectUI] = useTonConnectUI();
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

      } catch (error) {
        setErrorText(getErrorText(error, t("fetchError")));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);


  async function onClickRefundHandler() {
    try {
      const transaction = TxRequestBuilder.refundMessage(
        launchData?.version ?? GlobalVersions.V1,
        {
          launchAddress: Address.parse(launchData?.address ?? "").toRawString(),
          isCreator: launchData?.creator === localStorageWrapper.get(CALLER_ADDRESS),
        }
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });
    } catch (error) {
      // setErrorText(getErrorText(error, t("refundError")));
    }
  }

  async function onClickClaimHandler() {
    try {
      const transaction = TxRequestBuilder.claimMessage(
        launchData?.version ?? GlobalVersions.V1,
        {
          launchAddress: Address.parse(launchData?.address ?? "").toRawString(),
        }
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });
    } catch (error) {
      // setErrorText(getErrorText(error, t("claimError")));
    }
  }

  function onClickRedirectRoDeDust(masterAddress: string) {
    window.open(`https://dedust.io/swap/TON/${Address.parse(masterAddress).toString()}`, "_blank");
  }

  function renderContent() {
    if (phase === SalePhase.WHITELIST) {
      return launchData && (whitelistStatus || (ticketBalance && ticketBalance > 0)) ? (
        <WhitelistBuyInput
          launchAddress={launchData.address}
        />
      ) : (
        <GetTicketsButton />
      );
    }

    if (launchData && phase === SalePhase.PUBLIC) {
      return (
        <PublicBuyInput
          launchAddress={launchData.address}
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
            <Label label={t("deployingJetton")} variantSize="regular16" />
          </CustomButton>
        );
      }

      if (launchData?.isSuccessful === false) {
        // Лаунч неуспешен, показываем рефанд
        return (
          <CustomConnectButton
            fullWidth
            showDropdown={false}
            successChildren={(
              <CustomButton
                fullWidth
                padding="10px"
                background="red"
                onClick={onClickRefundHandler}
              >
                <Label label={t("refund")} variantSize="regular16" />
              </CustomButton>
            )}
          />
        );
      }

      if (launchData?.isSuccessful === true) {
        // Лаунч успешен
        if (launchData?.postDeployEnrollmentStats === null) {
          // Жеттон еще не задеплоен
          return (
            <CustomButton
              fullWidth
              padding="10px"
              background="gray"
              addHover={false}
            >
              <Label label={t("deployingJetton")} variantSize="regular16" />
            </CustomButton>
          );
        }

        if (launchData?.postDeployEnrollmentStats && !launchData?.dexData) {
          // Жеттон задеплоен, пул еще нет
          return (
            <CustomButton
              fullWidth
              padding="10px"
              background="gray"
              addHover={false}
            >
              <Label label={t("deployingPool")} variantSize="regular16" />
            </CustomButton>
          );
        }

        if (launchData?.postDeployEnrollmentStats && launchData?.dexData) {
          // Пул задеплоен, показываем ссылки на swap и chart
          return (
            <Grid container width="100%" gap={1}>
              <CustomConnectButton
                fullWidth
                showDropdown={false}
                successChildren={(
                  <CustomButton
                    fullWidth
                    padding="10px"
                    background="orange"
                    onClick={onClickClaimHandler}
                  >
                    <Label label={t("claimButtons.label")} variantSize="regular16" />
                  </CustomButton>
                )}
              />

              <Grid container gap={1} width="100%">
                <Grid size="grow">
                  <CustomButton
                    fullWidth
                    padding="10px 0px"
                    onClick={() => onClickRedirectRoDeDust(launchData.postDeployEnrollmentStats?.deployedJetton.masterAddress || "")}
                    background="gray"
                  >
                    <Grid
                      container
                      gap={0.5}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <ArrowUpRightIcon />
                      <Label label={t("swap")} variantSize="regular16" />
                    </Grid>
                  </CustomButton>
                </Grid>

                <Grid size="grow">
                  <CustomButton
                    fullWidth
                    padding="10px 0px"
                    background="gray"
                  >
                    <Grid
                      container
                      gap={0.5}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <ArrowUpRightIcon />
                      <Label label={t("chart")} variantSize="regular16" />
                    </Grid>
                  </CustomButton>
                </Grid>
              </Grid>
            </Grid>
          );
        }
      }
    }

    return "it`s absolute meowable case";
  }


  return {
    isLoading,
    errorText,
    renderContent,
  };
}
