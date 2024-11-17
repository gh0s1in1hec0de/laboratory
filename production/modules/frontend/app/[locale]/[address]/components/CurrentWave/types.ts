import { TokenLaunchTimings, SalePhase } from "starton-periphery";

export interface CurrentWaveProps {
  timings: TokenLaunchTimings;
}

export interface StageInfo {
  stage: SalePhase;
  label: string;
  stageNext?: SalePhase;
}
