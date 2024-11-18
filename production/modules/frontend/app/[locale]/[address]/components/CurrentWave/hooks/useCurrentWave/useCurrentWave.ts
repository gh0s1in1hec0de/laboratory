import { useTranslations } from "next-intl";
import { getCurrentSalePhase, SalePhase, TokenLaunchTimings } from "starton-periphery";

export function useCurrentWave(timings: TokenLaunchTimings) {
  const t = useTranslations("CurrentLaunch.wave");
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
      return t("prev"); 
    }
    if (getPhaseOrder(stage) === getPhaseOrder(currentPhase)) {
      return t("now"); 
    }
    return t("waiting"); 
  }

  return {
    calculateProgress,
    getStageLabel,
    currentPhase,
    nextPhaseIn,
  };
}
