import { ProgressInfo } from "@/common/ProgressInfo";
import { Label } from "@/common/Label";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { TonProvider } from "@/providers/ton";
import Grid from "@mui/material/Grid2";
import { fromNano } from "@ton/core";
import { useTranslations } from "next-intl";
import { RefundableDrawer } from "./components/RefundableDrawer";
import { LaunchActionsProps } from "./types";
import { useLaunchActions } from "./hooks/useLaunchActions";
import { CALLER_ADDRESS } from "@/constants";
import { localStorageWrapper } from "@/utils";
import { ClaimButtons } from "./components/ClaimButtons";

export function LaunchActions({ 
  isAvailableClaim,
  launchData
}: LaunchActionsProps) {
  const t = useTranslations("CurrentLaunch.contribute");
  // const { 

  //  } = useLaunchActions();

  return (
    <Grid 
      container
      width="100%"
    >
      <Grid 
        container
        width="100%"
        gap={1}
      >
        <Grid 
          container
          width="100%"
          alignItems="center" 
          gap={1}
        >
          <Grid size="grow">
            <Label 
              label={t("title")} 
              variantSize="semiBold18" 
              cropped
            />
          </Grid>

          <RefundableDrawer />
        </Grid>

        <Label 
          label={localStorageWrapper.get(CALLER_ADDRESS) ? t("connectWallet") : t("needStarTicket")} 
          variantSize="regular16"
          variantColor="gray"
          paddingBottom={0.5}
        />

        <TonProvider>
          <CustomConnectButton
            successChildren={
              isAvailableClaim ? (
                <ClaimButtons isLoading={false} />
              ) : (
                <div>1123</div>
              )
            }
            fullWidth
            showDropdown={false}
          />
        </TonProvider>

        <ProgressInfo
          collected={Number(fromNano(launchData?.totalTonsCollected || 0))}
          max={Number(fromNano(launchData?.minTonTreshold || 0))}
        />
      </Grid>
      

    </Grid>
  );
}
