import { GridSize, ResponsiveStyleValue } from "@mui/material";
import { ElementType, ReactNode } from "react";

export type ContainerProps = {
  children: ReactNode;
  as?: ElementType;
  size?: ResponsiveStyleValue<GridSize>;
}
