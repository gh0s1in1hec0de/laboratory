import { ButtonBackground, ButtonBorderColor } from "../CustomButton";
import { LabelColors } from "../Label";

export enum CustomTabsVariant {
  DEFAULT = "default",
  TRANSPARENT_OUTLINE = "transparentOutline",
}

export interface Tab<T> {
  label: string;
  value: T;
}

export interface CustomTabsProps<T> {
  selectedTab: T;
  onChange: (tab: T) => void;
  tabs: Tab<T>[];
  disabled?: boolean;
  variant?: `${CustomTabsVariant}`;
}


interface ButtonConfig {
  background: (selected: boolean) => `${ButtonBackground}`;
  borderColor: (selected: boolean) => `${ButtonBorderColor}`;
  addHover: (selected: boolean, disabled: boolean) => boolean;
}

interface LabelConfig {
  variantColor: (selected: boolean) => `${LabelColors}`;
}

interface TabVariantConfig {
  button: ButtonConfig;
  label: LabelConfig;
}

export type TabVariantsConfigMap = {
  [key in `${CustomTabsVariant}`]: TabVariantConfig;
};
