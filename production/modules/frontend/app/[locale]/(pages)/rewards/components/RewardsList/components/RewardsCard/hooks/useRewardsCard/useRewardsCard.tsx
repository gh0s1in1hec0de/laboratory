import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { PAGES } from "@/constants";
import { ArrowUpRightIcon } from "@/icons";
import { formatTime, getErrorText } from "@/utils";
import Grid from "@mui/material/Grid2";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { Address } from "@ton/core";
import { TonClient4 } from "@ton/ton";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ExtendedUserBalance,
  GetConfigResponse,
  GlobalVersions,
  MoneyFlows,
  Network,
  SalePhase,
  TxRequestBuilder,
  calculateUserRewardAmount,
  getApproximateClaimAmount,
  getContractData,
  getCurrentSalePhase,
  RewardPool,
  JettonMetadata
} from "starton-periphery";

export function useRewardsCard(extendedBalance: ExtendedUserBalance, rewardPool?: (RewardPool & {
  metadata: JettonMetadata;
})[]) {
  const t = useTranslations("Rewards");
  const { phase, nextPhaseIn } = getCurrentSalePhase(extendedBalance.timings);
  const { days, hours, minutes } = formatTime(nextPhaseIn || 0);
  const [errorText, setErrorText] = useState<string>("");
  const [tonConnectUI] = useTonConnectUI();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();
  const [configData, setConfigData] = useState<GetConfigResponse & MoneyFlows | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [displayValue, setDisplayValue] = useState<bigint>();

  useEffect(() => {
    (async () => {
      try {
        const tonClient = new TonClient4({
          endpoint: await getHttpV4Endpoint({ network: process.env.NEXT_PUBLIC_NETWORK as Network }),
        });

        const {
          creatorFutJetLeft,
          creatorFutJetPriceReversed,
          wlRoundFutJetLimit,
          wlRoundTonLimit,
          syntheticTonReserve,
          syntheticJetReserve,
          futJetDexAmount,
          futJetPlatformAmount,
          minTonForSaleSuccess,
          creatorFutJetBalance,
          publicRoundFutJetSold,
          pubRoundFutJetLimit,
          totalTonsCollected,
          wlRoundTonInvestedTotal,
        } = (await getContractData(
          "All",
          tonClient,
          // Address.parse("0:91b0b2deb5276bc2030315d3c650b0366138bc9ea8e1b10f1eade54271369b67")
          Address.parse(extendedBalance.tokenLaunch),
        )) as GetConfigResponse & MoneyFlows;

        setConfigData({
          wlRoundFutJetLimit,
          wlRoundTonLimit,
          creatorFutJetLeft,
          creatorFutJetPriceReversed,
          creatorFutJetBalance,
          publicRoundFutJetSold,
          pubRoundFutJetLimit,
          totalTonsCollected,
          wlRoundTonInvestedTotal,
          futJetDexAmount,
          futJetPlatformAmount,
          minTonForSaleSuccess,
          syntheticTonReserve,
          syntheticJetReserve,
        });

      } catch (error) {
        console.error("Error fetching config data (getContractData):", error);
      }
    })();
  }, []);

  useEffect(() => {
    try {
      if (configData) {
        const res = getApproximateClaimAmount(
          {
            creatorFutJetBalance: configData.creatorFutJetBalance,
            publicRoundFutJetSold: configData.publicRoundFutJetSold,
            syntheticJetReserve: configData.syntheticJetReserve,
            syntheticTonReserve: configData.syntheticTonReserve,
            totalTonsCollected: configData.totalTonsCollected,
            wlRoundTonInvestedTotal: configData.wlRoundTonInvestedTotal,
          },
          {
            creatorFutJetBalance: configData.creatorFutJetBalance,
            creatorFutJetLeft: configData.creatorFutJetLeft,
            creatorFutJetPriceReversed: configData.creatorFutJetPriceReversed,
            futJetDexAmount: configData.futJetDexAmount,
            futJetPlatformAmount: configData.futJetPlatformAmount,
            minTonForSaleSuccess: configData.minTonForSaleSuccess,
            pubRoundFutJetLimit: configData.pubRoundFutJetLimit,
            wlRoundFutJetLimit: configData.wlRoundFutJetLimit,
            wlRoundTonLimit: configData.wlRoundTonLimit
          },
          {
            jettons: extendedBalance.jettons,
            whitelistTons: extendedBalance.whitelistTons
          },
          extendedBalance.isCreator
        );

        setDisplayValue(res);
      }
    } catch (error) {
      console.error("Error in getApproximateClaimAmount:", error);
    } finally {
      setIsLoading(false);
    }
  }, [configData]);


  async function onClickRefundHandler() {
    try {
      const transaction = TxRequestBuilder.refundMessage(
        extendedBalance.version,
        {
          launchAddress: Address.parse(extendedBalance.tokenLaunch).toRawString(),
          isCreator: Boolean(extendedBalance.isCreator),
        }
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });
    } catch (error) {
      setErrorText(getErrorText(error, t("refundError")));
    }
  }

  async function onClickClaimHandler() {
    try {
      const transaction = TxRequestBuilder.claimMessage(
        GlobalVersions.V1,
        {
          launchAddress: "",
        }
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });
    } catch (error) {
      setErrorText(getErrorText(error, t("claimError")));
    }
  }

  async function onClickContributeHandler() {
    startTransition(() => {
      router.push(`/${locale}/${PAGES.Quests}`);
    });
  }

  function renderPhase() {
    switch (phase) {
    case SalePhase.CREATOR:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="green"
          padding="4px 10px"
          rounded="xs"
        >
          <Label
            label="Creator"
            variantSize="regular14"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    case SalePhase.WHITELIST:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="gray"
          padding="4px 10px"
          rounded="xs"
        >
          <Label
            label="Star Club"
            variantSize="regular14"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    case SalePhase.PUBLIC:
      return (
        <MainBox
          container
          alignItems="center"
          gap="2px"
          bgColor="orange"
          padding="4px 10px"
          rounded="xs"
        >
          <Label
            label="Public"
            variantSize="regular14"
            variantColor="orange"
            cropped
          />
        </MainBox>
      );
    case SalePhase.ENDED:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="orange"
          padding="4px 10px"
          rounded="xs"
        >
          <Label
            label="Ended"
            variantSize="regular14"
            variantColor="red"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    default:
      return null;
    }
  }

  function renderButton() {
    switch (extendedBalance.isSuccessful) {
    case true:
      return (
        <CustomButton
          padding="10px 0"
          fullWidth
          onClick={onClickClaimHandler}
        >
          <Label
            label={t("claim")}
            variantSize="medium16"
            offUserSelect
          />
        </CustomButton>
      );
    case false:
      return (
        <CustomButton
          padding="10px 0"
          background="red"
          fullWidth
          onClick={onClickRefundHandler}
        >
          <Label
            label={t("refund")}
            variantSize="medium16"
            offUserSelect
          />
        </CustomButton>
      );
    default:
      return (
        <CustomButton
          background="gray"
          padding="10px 0"
          fullWidth
          onClick={onClickContributeHandler}
        >
          <Grid
            container
            gap={1}
            alignItems="center"
            justifyContent="center"
          >
            <ArrowUpRightIcon />
            <Label
              label={t("contributeMore")}
              variantSize="medium16"
              offUserSelect
            />
          </Grid>
        </CustomButton>
      );
    }
  }

  return {
    days,
    hours,
    minutes,
    renderPhase,
    renderButton,
    errorText,
    isPending,
    isLoading,
    displayValue
  };
}