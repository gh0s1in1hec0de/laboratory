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
import { TonProvider } from "@/providers/ton";
import { CurrentLaunchSkeleton } from "./components/CurrentLaunchSkeleton";
import { Address } from "@ton/core";

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

  return (
    <LoadingWrapper
      isLoading={isLoading || localStorageWrapper.get(CALLER_ADDRESS) === null}
      skeleton={<CurrentLaunchSkeleton />}
    >
      <Grid
        container
        flexDirection="column"
        alignItems="center"
        width="100%"
        gap={2}
      >
        <BgLight />

        {launchData && (
          <TonProvider>
            <LaunchHeader
              avatarSrc={launchData.metadata.image}
              symbol={launchData.metadata.symbol}
              name={launchData.metadata.name}
              holders={launchData.activeHolders}
              telegramLink={launchData.telegramLink}
              xLink={launchData.xLink}
              websiteLink={launchData.website}
              launchAddress={launchData.address}
              timings={launchData.timings}
              getLaunchLink={getLaunchLink}
              version={launchData.version}
              showHolders
              showBIO
              showPrice
            />
        
            <LaunchActions
              launchData={launchData}
            />

            {launchData && <CurrentWave timings={launchData.timings} />}

            <RewardsInfo address={launchData.address} />

            <LaunchInfo
              launchData={launchData}
              showRefund={!!balance || Address.parse(launchData.creator).toRawString() === localStorageWrapper.get(CALLER_ADDRESS)}
            />
          </TonProvider>
        )}
      </Grid>
    </LoadingWrapper>
  );
}
