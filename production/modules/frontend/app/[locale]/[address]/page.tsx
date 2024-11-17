"use client";

import { Label } from "@/common/Label";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { LaunchHeader } from "@/components/LaunchHeader";
import Grid from "@mui/material/Grid2";
import { useCurrentLaunch } from "./hooks/useCurrentLaunch";
import { CurrentLaunchPageProps } from "./types";
import { BgLight } from "@/common/BgLight";
import { CurrentWave } from "./components/CurrentWave";
import { getCurrentSalePhase } from "starton-periphery";

export default function CurrentLaunch({
  params: { address }
}: CurrentLaunchPageProps) {
  const {
    launchData,
    isLoading,
    errorText,
    getLaunchLink
  } = useCurrentLaunch(address);

  if (errorText) {
    return (
      <Label
        label={errorText}
        variantColor="red"
        variantSize="regular14"
        textAlign="center"
      />
    );
  }

  return (
    <LoadingWrapper
      isLoading={isLoading}
    >
      <Grid
        container
        flexDirection="column"
        alignItems="center"
        width="100%"
        gap={2}
      >
        <BgLight />

        <LaunchHeader
          avatarSrc={launchData?.metadata.image}
          symbol={launchData?.metadata.symbol}
          name={launchData?.metadata.name}
          holders={launchData?.activeHolders}
          telegramLink={launchData?.telegramLink}
          xLink={launchData?.xLink}
          websiteLink={launchData?.website}
          getLaunchLink={getLaunchLink}
          showHolders
          showBIO
        />

        {launchData && <CurrentWave timings={launchData.timings} />}
      </Grid>
    </LoadingWrapper>
  );
}
