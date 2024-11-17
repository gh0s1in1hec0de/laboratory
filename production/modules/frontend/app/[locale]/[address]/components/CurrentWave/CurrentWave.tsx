import { useTranslations } from "next-intl";
import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { LaunchTimer } from "@/components/LaunchTimer";
import { CurrentWaveProps } from "./types";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./CurrentWave.module.scss";
import { getCurrentSalePhase, SalePhase, TokenLaunchTimings } from "starton-periphery";
import { STAGES_INFO } from "./constants";

export function CurrentWave({ timings }: CurrentWaveProps) {
  const t = useTranslations("CurrentLaunch.wave");
  // const testTimings: TokenLaunchTimings = {
  //   endTime:             1731858449, // 5
  //   startTime:           1731803754, // 1
  //   wlRoundEndTime:      1731831788, // 3
  //   publicRoundEndTime:  1731847679, // 4
  //   creatorRoundEndTime: 1731815694  // 2
  // };

  const { phase: currentPhase, nextPhaseIn } = getCurrentSalePhase(timings);

  const phaseOrder: Record<SalePhase, number> = {
    [SalePhase.NOT_STARTED]: 0,
    [SalePhase.CREATOR]: 1,
    [SalePhase.WHITELIST]: 2,
    [SalePhase.PUBLIC]: 3,
    [SalePhase.ENDED]: 4,
  };

  function getPhaseOrder(phase: SalePhase): number {
    return phaseOrder[phase] ?? -1; // Возвращаем -1, если фаза неизвестна
  }

  function getMaxStageDuration(stage: SalePhase): number {
    switch (stage) {
    case SalePhase.WHITELIST:
      return timings.wlRoundEndTime - timings.creatorRoundEndTime;
    case SalePhase.PUBLIC:
      return timings.publicRoundEndTime - timings.wlRoundEndTime;
    case SalePhase.ENDED:
      return 100; // Для стадии ENDED прогресс фиксирован.
    default:
      return 0;
    }
  }

  function calculateProgress(stage: SalePhase): number {
    if (stage === SalePhase.ENDED && currentPhase === SalePhase.ENDED) {
      return 50; // Для стадии ENDED прогресс фиксирован на 50
    }
  
    if (getPhaseOrder(stage) < getPhaseOrder(currentPhase)) {
      return 100; // Завершённые стадии
    }
  
    if (getPhaseOrder(stage) > getPhaseOrder(currentPhase)) {
      return 0; // Будущие стадии
    }
  
    // Для текущей стадии
    const maxDuration = getMaxStageDuration(stage);
    const elapsedTime = maxDuration - (nextPhaseIn ?? maxDuration);
  
    return Math.min((elapsedTime / maxDuration) * 100, 100); // Прогресс в процентах
  }

  function getStageLabel(stage: SalePhase): string {
    if (getPhaseOrder(stage) < getPhaseOrder(currentPhase)) {
      return t("prev"); // Фаза завершена
    }
    if (getPhaseOrder(stage) === getPhaseOrder(currentPhase)) {
      return t("now"); // Текущая фаза
    }
    return t("waiting"); // Будущая фаза
  }

  return (
    <Grid container flexDirection="column" gap={1.5}>
      <Label label={t("title")} variantSize="semiBold18" />

      <LaunchTimer initialSeconds={nextPhaseIn ?? 0} />

      <Grid container gap={0.5}>
        {STAGES_INFO.map((stage, index) => (
          <Grid size="grow" container key={index}>
            <LinearProgress
              variant="determinate"
              value={calculateProgress(stage.stage)} // Рассчитанное значение прогресса
              classes={{
                bar: styles.bar,
                root: styles.root,
              }}
            />

            <Grid container flexDirection="column">
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
        ))}
      </Grid>
    </Grid>
  );
}
