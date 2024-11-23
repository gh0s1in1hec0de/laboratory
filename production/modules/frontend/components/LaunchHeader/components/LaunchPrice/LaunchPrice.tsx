import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { useLaunchPrice } from "./hooks/useLaunchPrice";
import { LaunchPriceProps } from "./types";
import { LoadingWrapper } from "@/common/LoadingWrapper";

export function LaunchPrice({
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

  // todo: add skeleton
  return (
    <LoadingWrapper isLoading={isLoading}>
      <Grid 
        container
        gap={0.5}
        width="100%"
      >
        <Label 
          label={t("price")}
          variantColor="gray"
          variantSize="regular14"
        />

        <Grid container width="100%">
          <Label 
            label={`${price?.toFixed(10) ?? 0} TON`}
            variantSize="semiBold18"
          />
        </Grid>
      </Grid>
    </LoadingWrapper>
  );
}
