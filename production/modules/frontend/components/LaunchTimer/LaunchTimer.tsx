import Grid from "@mui/material/Grid2";
import { LaunchTimerProps } from "./types";
import { TimerCard } from "./components/TimerCard";
import { ColonIcon } from "@/icons";
import { useLaunchTimer } from "./hooks/useLaunchTimer";
import { LaunchTimerSkeleton } from "./components/LaunchTimerSkeleton";
import { LoadingWrapper } from "@/common/LoadingWrapper";

export function LaunchTimer({
  initialSeconds,
  fullPageLoader = true,
  isLoading = false
}: LaunchTimerProps) {
  const {
    days,
    hours,
    minutes,
    seconds,
    isMounted,
  } = useLaunchTimer(initialSeconds, isLoading);

  return (
    <LoadingWrapper 
      isLoading={!isMounted || isLoading}
      skeleton={fullPageLoader ? undefined : <LaunchTimerSkeleton/>}
    >
      <Grid
        container
        justifyContent="center"
        gap={1}
      >
        <Grid container alignItems="center">
          <TimerCard
            label="days"
            value={days}
          />
          <ColonIcon />
          <TimerCard
            label="hours"
            value={hours}
          />
        </Grid>

        <Grid container alignItems="center">
          <TimerCard
            label="minutes"
            value={minutes}
          />
          <ColonIcon />
          <TimerCard
            label="seconds"
            value={seconds}
          />
        </Grid>
      </Grid>
    </LoadingWrapper>
  );
}
