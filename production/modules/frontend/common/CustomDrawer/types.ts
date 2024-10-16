import { PropsWithChildren } from "react";

export interface CustomDrawerProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  anchor?: "bottom" | "left" | "top" | "right";
  autoFocus?: boolean;
  closeButtonLabel?: string;
}
