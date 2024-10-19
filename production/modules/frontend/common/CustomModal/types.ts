import { PropsWithChildren } from "react";

export interface CustomModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose?: () => void;
  fullScreen?: boolean;
  autoClose?: boolean;
  padding?: string | number;
}
