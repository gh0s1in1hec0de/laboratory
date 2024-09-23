import { PAGES } from "@/constants";

export interface NavbarItemType {
  id: string;
  page: `${PAGES}`;
  label: string;
  IconComponent: ({ active } : { active?:boolean }) => JSX.Element;
}
