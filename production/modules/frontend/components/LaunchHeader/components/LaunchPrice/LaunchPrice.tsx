import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { useLaunchPrice } from "./hooks/useLaunchPrice";
import { LaunchPriceProps } from "./types";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { LaunchPriceSkeleton } from "./components/LaunchPriceSkeleton";
import { ChartUpIcon, ChartDownIcon } from "@/icons";

export function LaunchPrice({
  tradingStats,
  launchAddress,
  timings,
  version
}: LaunchPriceProps) {
  const t = useTranslations("CurrentLaunch");
  const { 
    price,
    isLoading
  } = useLaunchPrice({
    launchAddress,
    timings,
    version
  });

  return (
    <LoadingWrapper 
      isLoading={isLoading}
      skeleton={<LaunchPriceSkeleton/>}
    >
      <Grid 
        container
        gap={0.5}
        width="100%"
        alignItems="center"
      >
        <Grid 
          container
          size="grow"
          flexDirection="column"
          gap={0.5}
        >
          <Label 
            label={t("price")}
            variantColor="gray"
            variantSize="regular14"
          />

          <Grid container size="grow">
            <Label 
              label={`~${price?.toFixed(10) ?? 0} TON`}
              variantSize="semiBold18"
              cropped
            />
          </Grid>
        </Grid>

        <Grid container>
          {!tradingStats || tradingStats.trend === "bullish" ? (
            <ChartUpIcon />
          ) : (
            <ChartDownIcon />
          )}
        </Grid>
      </Grid>
    </LoadingWrapper>
  );
}
