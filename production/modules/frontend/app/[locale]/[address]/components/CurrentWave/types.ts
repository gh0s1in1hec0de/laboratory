import { ExtendedLaunch, SalePhase } from "starton-periphery";

export interface CurrentWaveProps {
  launchData: ExtendedLaunch;
}

export interface StageInfo {
  stage: SalePhase;
  label: string;
  label2?: string;
  stageNext?: SalePhase;
}
