"use client";

import { Dialog } from "@mui/material";
import { CustomModalProps } from "./types";

export function CustomModal({
  isOpen,
  onClose,
  fullScreen = false,
  children,
}: CustomModalProps) {
  return (
    <Dialog
      fullScreen={fullScreen}
      open={isOpen}
      onClose={onClose}
    >
      {children}
    </Dialog>
  );
}
