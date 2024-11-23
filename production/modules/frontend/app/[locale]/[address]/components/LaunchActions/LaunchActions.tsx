import { Label } from "@/common/Label";
import { ProgressInfo } from "@/common/ProgressInfo";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import Grid from "@mui/material/Grid2";
import { fromNano } from "@ton/core";
import { useTranslations } from "next-intl";
import { Buttons } from "./components/Buttons";
import { RefundableDrawer } from "./components/RefundableDrawer";
import { LaunchActionsProps } from "./types";
import { TonProvider } from "@/providers/ton";

export function LaunchActions({
  launchData
}: LaunchActionsProps) {
  const t = useTranslations("CurrentLaunch.contribute");

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

        {/* todo: может добавить или нет */}
        {/* <Label 
          label={true ? t("connectWallet") : t("needStarTicket")} 
          variantSize="regular16"
          variantColor="gray"
          paddingBottom={0.5}
        /> */}

        <TonProvider>
          <CustomConnectButton
            successChildren={<Buttons launchData={launchData} />}
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
