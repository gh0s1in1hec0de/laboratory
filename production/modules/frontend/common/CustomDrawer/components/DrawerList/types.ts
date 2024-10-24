import { LabelColors, LabelVariants } from "@/common/Label";

export enum DrawerListVariant {
  CIRCLE = "circle",
  STAR = "star",
}

export interface ListData {
  id: string;
  text: string;
  isBold: boolean;
  isHighlight: boolean;
  isCursive: boolean;
  variantSize: `${LabelVariants}`;
  description?: ListData[];
}

export interface DrawerListProps {
  data: ListData[];
  variant?: `${DrawerListVariant}`;
  highlightColor?: `${LabelColors}`;
  paddingTop?: string | number;
  paddingBottom?: string | number;
  index?: number;
}
