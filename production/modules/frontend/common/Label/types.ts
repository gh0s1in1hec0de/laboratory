import { TypographyProps } from "@mui/material";

type LabelVariants =
  | "medium10" 
  | "bold18"
  | "regular16"
  | "regular14"
  | "medium14"
  | "semiBold32"
  | "regular12"
  | "bold18"
  | "medium16"
  | "semiBold18";

export enum LabelColors {
  Orange = "orange",
  White = "white",
  Gray = "gray",
  Red = "red",
  Green = "green",
}
  
export interface LabelProps extends TypographyProps {
  label: string;
  variantSize?: LabelVariants;
  variantColor?: `${LabelColors}`;
  className?: string;
  offUserSelect?: boolean;
  disabled?: boolean;
}
