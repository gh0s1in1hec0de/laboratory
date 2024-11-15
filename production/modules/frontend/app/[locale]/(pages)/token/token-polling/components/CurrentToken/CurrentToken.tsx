import Grid from "@mui/material/Grid2";
import { CurrentTokenProps } from "./types";
import { BgLight } from "@/common/BgLight";
import { LaunchHeader } from "@/components/LaunchHeader";
import { TokenBody } from "./components/TokenBody";
import { LaunchTimer } from "@/components/LaunchTimer";
import { getCurrentSalePhase } from "starton-periphery";

export function CurrentToken({ launchData }: CurrentTokenProps) {
  const testTimings = {
    endTime: 1731644879,
    startTime: 1731583302,
    wlRoundEndTime: 1731614419,
    publicRoundEndTime: 1731633702,
    creatorRoundEndTime: 1731606825,
  };

  return (
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
      />

      <TokenBody
        symbol={launchData?.metadata.symbol}
      />

      {/* TODO: change */}
      <LaunchTimer
        initialSeconds={getCurrentSalePhase(testTimings).nextPhaseIn}
        // initialSeconds={getCurrentSalePhase(launchData?.timings).nextPhaseIn}
      />
    </Grid>
  );
}
