import { Grid2Props } from "@mui/material";
import { ElementType, ReactNode } from "react";

export interface ContainerProps extends Grid2Props {
  children: ReactNode;
  as?: ElementType;
}
