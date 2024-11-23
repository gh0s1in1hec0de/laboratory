import { TokenLaunchTimings, GlobalVersions } from "starton-periphery";

export interface LaunchPriceProps {
  launchAddress: string;
  timings: TokenLaunchTimings;
  version: GlobalVersions;
}
