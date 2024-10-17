import { Grid2Props } from "@mui/material/Grid2";

export interface InfoBlockProps extends Grid2Props{
  onClick: () => void;
  label: string;
  rounded?: boolean;
}

