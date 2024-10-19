import { TypographyProps } from "@mui/material";

export type LabelVariants =
  | "medium10" 
  | "bold18"
  | "regular16"
  | "regular14"
  | "medium14"
  | "semiBold32"
  | "medium32"
  | "regular12"
  | "bold18"
  | "medium16"
  | "semiBold18"
  | "bold24"
  | "semiBold24";

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
  isBold?: boolean;
  isCursive?: boolean;
}
