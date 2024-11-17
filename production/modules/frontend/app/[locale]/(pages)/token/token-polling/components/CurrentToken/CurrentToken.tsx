import { BgLight } from "@/common/BgLight";
import { LaunchHeader } from "@/components/LaunchHeader";
import { LaunchTimer } from "@/components/LaunchTimer";
import Grid from "@mui/material/Grid2";
import { getCurrentSalePhase } from "starton-periphery";
import { TokenBody } from "./components/TokenBody";
import { CurrentTokenProps } from "./types";
import { TonProvider } from "@/providers/ton";

export function CurrentToken({ launchData }: CurrentTokenProps) {
  //todo: remove
  // const testTimings = {
  //   endTime: 1731845849,
  //   startTime: 1731779692,
  //   wlRoundEndTime: 1731813136,
  //   publicRoundEndTime: 1731839869,
  //   creatorRoundEndTime: 1731804413
  // };
  // const secondsToNextPhase = getCurrentSalePhase(testTimings).nextPhaseIn;

  const secondsToNextPhase = getCurrentSalePhase(launchData?.timings).nextPhaseIn;

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

      <TonProvider>
        <TokenBody
          supply={launchData?.totalSupply}
          symbol={launchData?.metadata.symbol}
          launchAddress={launchData?.address}
        />
      </TonProvider>

      <LaunchTimer
        initialSeconds={secondsToNextPhase}
      />
    </Grid>
  );
}
