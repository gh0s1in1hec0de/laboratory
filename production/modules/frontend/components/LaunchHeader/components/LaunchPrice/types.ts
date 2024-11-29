import { TokenLaunchTimings, GlobalVersions, LaunchTradingStats } from "starton-periphery";

export interface LaunchPriceProps {
  launchAddress: string;
  timings: TokenLaunchTimings;
  version: GlobalVersions;
  tradingStats?: LaunchTradingStats;
}
