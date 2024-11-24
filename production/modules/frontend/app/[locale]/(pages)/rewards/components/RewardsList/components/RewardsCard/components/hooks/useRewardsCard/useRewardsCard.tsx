import {
  ExtendedUserBalance,
  getCurrentSalePhase,
  SalePhase,
  GlobalVersions,
  TxRequestBuilder,
} from "starton-periphery";
import { formatTime, getErrorText } from "@/utils";
import { MainBox } from "@/common/MainBox";
import { Label } from "@/common/Label";
import { useTranslations, useLocale } from "next-intl";
import { ArrowUpRightIcon } from "@/icons";
import { CustomButton } from "@/common/CustomButton";
import Grid from "@mui/material/Grid2";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useState, useTransition } from "react";
import { PAGES } from "@/constants";
import { useRouter } from "next/navigation";
import { Address } from "@ton/core";

export function useRewardsCard(extendedBalance: ExtendedUserBalance) {
  const t = useTranslations("Rewards");
  const { phase, nextPhaseIn } = getCurrentSalePhase(extendedBalance.timings);
  const { days, hours, minutes } = formatTime(nextPhaseIn || 0);
  const [errorText, setErrorText] = useState<string>("");
  const [tonConnectUI] = useTonConnectUI();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();

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
          rounded
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
          rounded
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
          rounded
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
          rounded
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
  };
}
