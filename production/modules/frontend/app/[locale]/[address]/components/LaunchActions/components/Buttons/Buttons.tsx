import Grid from "@mui/material/Grid2";
import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { ButtonsProps } from "./types";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { ConnectButtonSkeleton } from "@/components/CustomConnectButton";
import { ArrowUpRightIcon } from "@/icons";
import { ContributeInput } from "./components/ContributeInput";
import { SalePhase } from "starton-periphery";
import { useLaunchActions } from "./hooks/useLaunchActions";
import { GetTicketsButton } from "./components/GetTicketsButton";

export function Buttons({
  launchData,
}: ButtonsProps) {
  const t = useTranslations("CurrentLaunch.contribute");
  const { 
    isLoading,
    whitelistStatus,
    errorText,
    ticketBalance,
    phase,
    renderContent,
  } = useLaunchActions(launchData);

  return (
    <LoadingWrapper
      isLoading={isLoading}
      skeleton={<ConnectButtonSkeleton fullWidth />}
    >
      {errorText && (
        <Label
          label={errorText}
          variantSize="regular14"
          variantColor="red"
        />
      )}

      <Grid
        container
        width="100%"
      >
        {phase === SalePhase.ENDED ? (
          <CustomButton
            fullWidth
            padding="10px"
            background="gray"
            addHover={false}
          >
            <Label
              label={t("ended")}
              variantSize="regular16"
            />
          </CustomButton>
          // isSuccess === true claim
        ) : launchData && (whitelistStatus || (ticketBalance && ticketBalance > 0)) ? ( // WL PHASE
          <ContributeInput
            launchAddress={launchData.address}
            timings={launchData.timings}
          />
        ) : (
          <GetTicketsButton />
        )}

        {/* todo: public phase */}
        {/* PUBLIC PHASE */}


        {renderContent()}
      </Grid>
    </LoadingWrapper>
  );
}
