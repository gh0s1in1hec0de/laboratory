import { Grid2Props } from "@mui/material/Grid2";
import { ReactNode } from "react";

export enum MainBoxBgColor {
  Transparent = "transparent",
  Gray = "gray",
  Orange = "orange",
  Green = "green",
}

export enum MainBoxRounded {
  None = "none",
  Xs = "xs",
  Xl = "xl",
  Full = "full",
}

export interface MainBoxProps extends Grid2Props {
  children: ReactNode;
  bgColor?: `${MainBoxBgColor}`;
  className?: string;
  rounded?: `${MainBoxRounded}`;
  fullWidth?: boolean;
  showMoreRewards?: boolean;
  isOpen?: boolean;
}

