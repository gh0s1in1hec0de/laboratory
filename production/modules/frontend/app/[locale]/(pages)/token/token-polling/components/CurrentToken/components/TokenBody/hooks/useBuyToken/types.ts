import { TokenLaunchTimings } from "starton-periphery";

export interface UseBuyTokenProps {
  supply: bigint;
  launchAddress: string;
  timings: TokenLaunchTimings;
}
