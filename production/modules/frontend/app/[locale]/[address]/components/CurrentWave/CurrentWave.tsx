import { useTranslations } from "next-intl";
import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { LaunchTimer } from "@/components/LaunchTimer";
import { CurrentWaveProps } from "./types";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./CurrentWave.module.scss";
import { getCurrentSalePhase } from "starton-periphery";

export function CurrentWave({ timings }: CurrentWaveProps) {
  const t = useTranslations("CurrentLaunch.wave");
  const testTimings = {
    endTime: 1731858449,
    startTime: 1731803754,
    wlRoundEndTime: 1731831788,
    publicRoundEndTime: 1731847679,
    creatorRoundEndTime: 1731815694
  };

  const currentPhase = getCurrentSalePhase(testTimings);

  return (
    <Grid 
      container
      flexDirection="column"
      gap={1.5}
    >
      <Label label={t("title")} variantSize="semiBold18"/>

      <LaunchTimer initialSeconds={currentPhase.nextPhaseIn} />

      <Grid container gap={0.5}>
        <Grid size="grow" container gap={1.5}>
          <LinearProgress
            variant="determinate"
            value={20}
            classes={{
              bar: styles.bar,
              root: styles.root,
            }}
          />

          <Grid container flexDirection="column">
            <Label 
              label={t("publicStage")} 
              variantSize="medium16"
              variantColor="gray"
            />
            <Label 
              label={t("now")} 
              variantSize="regular14" 
              variantColor="gray"
            />
          </Grid>
        </Grid>

        

        
      </Grid>
    </Grid>
  );
}
