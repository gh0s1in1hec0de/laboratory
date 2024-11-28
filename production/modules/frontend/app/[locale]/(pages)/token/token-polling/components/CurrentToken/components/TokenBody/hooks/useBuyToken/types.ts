import { TokenLaunchTimings, GlobalVersions, SalePhase } from "starton-periphery";

export interface UseBuyTokenProps {
  supply: bigint;
  launchAddress: string;
  timings: TokenLaunchTimings;
  version: GlobalVersions;
  phase: SalePhase;
}
