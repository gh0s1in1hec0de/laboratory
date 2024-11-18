import { TokenLaunchTimings, GlobalVersions } from "starton-periphery";

export interface TokenBodyProps {
  supply: bigint;
  launchAddress: string;
  timings: TokenLaunchTimings;
  version: GlobalVersions;
  symbol?: string;
}

