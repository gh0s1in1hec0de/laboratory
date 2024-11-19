import Grid from "@mui/material/Grid2";
import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { useLaunchActions } from "../../hooks/useLaunchActions";
import { ButtonsProps } from "./types";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { ConnectButtonSkeleton } from "@/components/CustomConnectButton";
import { ArrowUpRightIcon } from "@/icons";
import { ContributeInput } from "./components/ContributeInput";

export function Buttons({
  launchData,
}: ButtonsProps) {
  const t = useTranslations("CurrentLaunch.contribute");
  const { 
    isLoading,
    whitelistStatus,
    errorText,
    ticketBalance,
  } = useLaunchActions(launchData);

  return (
    <LoadingWrapper
      isLoading={isLoading}
      skeleton={<ConnectButtonSkeleton fullWidth />}
    >
      {errorText && <Label label={errorText} variantSize="regular14" variantColor="red" />}
      <Grid
        container
        width="100%"
      >
        {whitelistStatus ||( ticketBalance && ticketBalance > 0 )? (
          // <CustomButton
          //   fullWidth
          //   padding="10px"
          // // onClick={onClickBuyTokens}
          // // disabled={!isValidAmount || isLoading}
          // >
          //   <Label
          //   // label={isLoading ? t("loading") : t("label")}
          //     label={t("claimButtons.label")}
          //     variantSize="regular16"
          //   />
          // </CustomButton>
          <ContributeInput launchAddress={launchData?.address || ""} />
        ) : (
          <CustomButton
            fullWidth
            padding="10px"
            background="gray"
          >
            <Grid 
              container
              gap={1}
              alignItems="center"
              justifyContent="center"
            >
              <ArrowUpRightIcon />
              <Label
                label={t("getStarTicket")}
                variantSize="regular16"
                offUserSelect
              />
            </Grid>
          </CustomButton>
        )}
      </Grid>
    </LoadingWrapper>
  );
}
