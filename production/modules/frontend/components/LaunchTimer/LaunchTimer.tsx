import Grid from "@mui/material/Grid2";
import { LaunchTimerProps } from "./types";
import { TimerCard } from "./components/TimerCard";
import { ColonIcon } from "@/icons";
import { useLaunchTimer } from "./hooks/useLaunchTimer";
import { LaunchTimerSkeleton } from "./components/LaunchTimerSkeleton";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("CurrentLaunch.timer");

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
            label={t("days")}
            value={days}
          />
          <ColonIcon />
          <TimerCard
            label={t("hours")}
            value={hours}
          />
        </Grid>

        <Grid container alignItems="center">
          <TimerCard
            label={t("minutes")}
            value={minutes}
          />
          <ColonIcon />
          <TimerCard
            label={t("seconds")}
            value={seconds}
          />
        </Grid>
      </Grid>
    </LoadingWrapper>
  );
}
