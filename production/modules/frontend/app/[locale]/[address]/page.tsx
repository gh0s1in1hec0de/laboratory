"use client";

import { Label } from "@/common/Label";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { LaunchHeader } from "@/components/LaunchHeader";
import Grid from "@mui/material/Grid2";
import { useCurrentLaunch } from "./hooks/useCurrentLaunch";
import { CurrentLaunchPageProps } from "./types";
import { BgLight } from "@/common/BgLight";
import { CurrentWave } from "./components/CurrentWave";
import { LaunchActions } from "./components/LaunchActions";
import { LaunchInfo } from "./components/LaunchInfo";
import { jettonFromNano } from "starton-periphery";
import { RewardsInfo } from "./components/RewardsInfo";

export default function CurrentLaunch({
  params: { address }
}: CurrentLaunchPageProps) {
  const {
    launchData,
    isLoading,
    errorText,
    getLaunchLink
  } = useCurrentLaunch(decodeURIComponent(address));

  if (errorText) {
    return (
      <Label
        sx={{ paddingTop: 2 }}
        label={errorText}
        variantColor="red"
        variantSize="regular14"
        textAlign="center"
      />
    );
  }

  // todo: add skeleton
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

        <LaunchActions
          launchData={launchData}
          isAvailableClaim={true}
        />

        {launchData && <CurrentWave timings={launchData.timings} />}

        <RewardsInfo address={launchData?.address ?? ""} />

        <LaunchInfo 
          launchData={launchData}
        />
      </Grid>
    </LoadingWrapper>
  );
}
