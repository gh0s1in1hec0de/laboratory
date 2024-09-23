import { NavbarItemType } from "../../types";

export interface NavbarItemsProps {
  itemLabels: Pick<NavbarItemType, "label" | "page">[];
}
