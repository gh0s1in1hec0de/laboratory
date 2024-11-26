import { Label } from "@/common/Label";
import { LaunchTimer } from "@/components/LaunchTimer";
import Grid from "@mui/material/Grid2";
import LinearProgress from "@mui/material/LinearProgress";
import { useTranslations } from "next-intl";
import { STAGES_INFO } from "./constants";
import styles from "./CurrentWave.module.scss";
import { useCurrentWave } from "./hooks/useCurrentWave";
import { CurrentWaveProps } from "./types";
import { SalePhase } from "starton-periphery";

export function CurrentWave({ launchData }: CurrentWaveProps) {
  const t = useTranslations("CurrentLaunch.wave");
  const {
    calculateProgress,
    getStageLabel,
    currentPhase,
    nextPhaseIn,
  } = useCurrentWave(launchData.timings);

  return (
    <Grid 
      container
      flexDirection="column"
      gap={1.5}
      width="100%"
    >
      <Label label={t("title")} variantSize="semiBold18" />

      <LaunchTimer initialSeconds={nextPhaseIn ?? 0} />

      <Grid container gap={0.5} width="100%">
        {currentPhase === SalePhase.ENDED ? (
          launchData?.isSuccessful === null ? (
            STAGES_INFO.map((stage, index) => (
              <Grid size="grow" container key={index}>
                <LinearProgress
                  variant="determinate"
                  value={calculateProgress(stage.stage)}
                  classes={{
                    bar: styles.bar,
                    root: styles.root,
                  }}
                />

                <Grid container flexDirection="column" paddingTop={1}>
                  <Label
                    label={t(stage.label)}
                    variantSize={currentPhase === stage.stage ? "medium16" : "regular16"}
                    variantColor={currentPhase === stage.stage ? "orange" : "gray"}
                  />
                  <Label
                    label={getStageLabel(stage.stage)}
                    variantSize="regular14"
                    variantColor="gray"
                  />
                </Grid>
              </Grid>
            ))
          ) : launchData?.isSuccessful === true ? (
            launchData?.postDeployEnrollmentStats === null ? (
              STAGES_INFO.map((stage, index) => (
                <Grid size="grow" container key={index}>
                  <LinearProgress
                    variant="determinate"
                    value={calculateProgress(stage.stage)}
                    classes={{
                      bar: styles.bar,
                      root: styles.root,
                    }}
                  />
                  <Grid container flexDirection="column" paddingTop={1}>
                    <Label
                      label={t(stage.label)}
                      variantSize={currentPhase === stage.stage ? "medium16" : "regular16"}
                      variantColor={currentPhase === stage.stage ? "orange" : "gray"}
                    />
                    <Label
                      label={getStageLabel(stage.stage)}
                      variantSize="regular14"
                      variantColor="gray"
                    />
                  </Grid>
                </Grid>
              ))
            ) : launchData?.postDeployEnrollmentStats && !launchData?.dexData ? (
              STAGES_INFO.map((stage, index) => (
                <Grid size="grow" container key={index}>
                  <LinearProgress
                    variant="determinate"
                    value={calculateProgress(stage.stage)}
                    classes={{
                      bar: styles.bar,
                      root: styles.root,
                    }}
                  />
                  <Grid container flexDirection="column" paddingTop={1}>
                    <Label
                      label={t(stage.label)}
                      variantSize={currentPhase === stage.stage ? "medium16" : "regular16"}
                      variantColor={currentPhase === stage.stage ? "orange" : "gray"}
                    />
                    <Label
                      label={getStageLabel(stage.stage)}
                      variantSize="regular14"
                      variantColor="gray"
                    />
                  </Grid>
                </Grid>
              ))
            ) : (
              <Label
                label={t("listingEnded")}
                variantSize="regular16"
                textAlign="center"
                cropped
              />
            )
          ) : (
            <Label
              label={t("failed")}
              variantSize="regular16"
              textAlign="center"
              cropped
            />
          )
        ) : (
          /* Рендер стадий для других фаз */
          STAGES_INFO.map((stage, index) => (
            <Grid size="grow" container key={index}>
              <LinearProgress
                variant="determinate"
                value={calculateProgress(stage.stage)}
                classes={{
                  bar: styles.bar,
                  root: styles.root,
                }}
              />
              <Grid container flexDirection="column" paddingTop={1}>
                <Label
                  label={t(stage.label)}
                  variantSize={currentPhase === stage.stage ? "medium16" : "regular16"}
                  variantColor={currentPhase === stage.stage ? "orange" : "gray"}
                />
                <Label
                  label={getStageLabel(stage.stage)}
                  variantSize="regular14"
                  variantColor="gray"
                />
              </Grid>
            </Grid>
          ))
        )}
      </Grid>
    </Grid>
  );
}
