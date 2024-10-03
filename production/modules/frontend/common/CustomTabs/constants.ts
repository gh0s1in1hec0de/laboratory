import { TabVariantsConfigMap } from "./types";

export const TAB_VARIANT_CONFIG: TabVariantsConfigMap = {
  default: {
    button: {
      background: (selected: boolean) => (selected ? "gray" : "transparent"),
      borderColor: () => "borderTransparent",
      addHover: (selected: boolean, disabled: boolean) => !selected && !disabled,
    },
    label: {
      variantColor: (selected: boolean) => (selected ? "white" : "gray"),
    },
  },
  transparentOutline: {
    button: {
      background: () => "transparent",
      borderColor: (selected: boolean) => (selected ? "borderOrange" : "borderGray"),
      addHover: (selected: boolean, disabled: boolean) => !selected && !disabled,
    },
    label: {
      variantColor: (selected: boolean) => (selected ? "orange" : "white"),
    },
  },
};
