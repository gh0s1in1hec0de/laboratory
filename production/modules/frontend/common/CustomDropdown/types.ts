import { ReactNode } from "react";

export interface CustomDropdownItem {
  label: string;
  onClick: () => void;
}

export interface CustomDropdownProps {
  Button: ReactNode;
  items: CustomDropdownItem[];
}
