import { TokenLaunchTimings } from "starton-periphery";

export interface TokenBodyProps {
  supply: bigint;
  launchAddress: string;
  timings: TokenLaunchTimings;
  symbol?: string;
}

