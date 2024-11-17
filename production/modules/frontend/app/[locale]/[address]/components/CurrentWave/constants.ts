import { SalePhase } from "starton-periphery";
import { StageInfo } from "./types";

export const STAGES_INFO: StageInfo[] = [
  {
    stage: SalePhase.WHITELIST,
    label: "starClubStage",
    stageNext: SalePhase.PUBLIC
  },
  {
    stage: SalePhase.PUBLIC,
    label: "publicStage",
    stageNext: SalePhase.ENDED
  },
  {
    stage: SalePhase.ENDED,
    label: "listingStage",
  }
];
