import { Grid2Props } from "@mui/material/Grid2";
import { ReactNode } from "react";

export enum MainBoxBgColor {
  Transparent = "transparent",
  Gray = "gray",
}

export interface MainBoxProps extends Grid2Props {
  children: ReactNode;
  bgColor?: `${MainBoxBgColor}`;
  className?: string;
  rounded?: boolean;
  fullWidth?: boolean;
}

