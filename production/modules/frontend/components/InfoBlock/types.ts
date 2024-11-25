import { MainBoxRounded } from "@/common/MainBox";
import { Grid2Props } from "@mui/material/Grid2";
import { MouseEvent } from "react";

export interface InfoBlockProps extends Grid2Props{
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  label: string;
  rounded?: `${MainBoxRounded}`;
}

