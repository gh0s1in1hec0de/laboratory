import { ReactNode } from "react";

export interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  children: ReactNode;
  anchor?: "bottom" | "left" | "top" | "right";
  autoFocus?: boolean;
}
