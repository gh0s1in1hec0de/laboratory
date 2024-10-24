import { LabelColors, LabelVariants } from "@/common/Label";

export interface TextData {
  id: string;
  text: string;
  isBold: boolean;
  isHighlight: boolean;
  isCursive: boolean;
  variantSize: `${LabelVariants}`;
}

export interface DrawerTextProps {
  data: TextData[];
  highlightColor?: `${LabelColors}`;
  inBox?: boolean;
  paddingTop?: string | number;
  paddingBottom?: string | number;
}
