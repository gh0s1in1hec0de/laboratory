import { SnackbarOrigin } from "@mui/material";

export interface CustomToastProps {
  text: string;
  severity: "success" | "error";
  open: boolean;
  toggleOpen: () => void;
  anchor?: SnackbarOrigin;
  duration?: number;
}
