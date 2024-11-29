import { TokenLaunchTimings, GlobalVersions, LaunchTradingStats } from "starton-periphery";

export interface LaunchHeaderProps {
  avatarSrc?: string;
  symbol?: string;
  name?: string;
  holders?: number;
  showHolders?: boolean;
  showBIO?: boolean;
  xLink?: string;
  telegramLink?: string;
  websiteLink?: string;
  getLaunchLink?: () => void;
  showPrice?: boolean;
  launchAddress?: string;
  timings?: TokenLaunchTimings;
  version?: GlobalVersions;
  tradingStats?: LaunchTradingStats;
}

export interface LaunchHeaderInfoProps {
  link: string;
  Icon: ({ disabled }: { disabled: boolean }) => JSX.Element;
}
