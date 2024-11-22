"use client";

import { BgLight } from "@/common/BgLight";
import { Label } from "@/common/Label";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { LaunchHeader } from "@/components/LaunchHeader";
import { CALLER_ADDRESS } from "@/constants";
import { localStorageWrapper } from "@/utils";
import Grid from "@mui/material/Grid2";
import { CurrentWave } from "./components/CurrentWave";
import { LaunchActions } from "./components/LaunchActions";
import { LaunchInfo } from "./components/LaunchInfo";
import { RewardsInfo } from "./components/RewardsInfo";
import { useCurrentLaunch } from "./hooks/useCurrentLaunch";
import { CurrentLaunchPageProps } from "./types";

export default function CurrentLaunch({
  params: { address }
}: CurrentLaunchPageProps) {
  const {
    launchData,
    isLoading,
    errorText,
    balance,
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
      isLoading={isLoading || localStorageWrapper.get(CALLER_ADDRESS) === null}
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
        />

        {launchData && <CurrentWave timings={launchData.timings} />}

        <RewardsInfo address={launchData?.address ?? ""} />

        <LaunchInfo
          launchData={launchData}
          showRefund={!!balance}
        />
      </Grid>
    </LoadingWrapper>
  );
}
