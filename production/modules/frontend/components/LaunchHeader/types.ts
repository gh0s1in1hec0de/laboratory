import { ReactNode } from "react";

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
  showChart?: boolean;
}

export interface LaunchHeaderInfoProps {
  link: string;
  Icon: ({ disabled }: { disabled: boolean }) => JSX.Element;
}
