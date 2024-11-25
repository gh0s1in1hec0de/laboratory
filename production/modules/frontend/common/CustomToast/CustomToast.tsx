import { Snackbar, Alert } from "@mui/material";
import { CustomToastProps } from "./types";
import { Label } from "@/common/Label";
import styles from "./CustomToast.module.scss";

export function CustomToast({ 
  text,
  severity,
  open,
  toggleOpen,
  anchor = { vertical: "top", horizontal: "right" },
  duration = 3000,
}: CustomToastProps) {
  return (
    <Snackbar
      anchorOrigin={anchor}
      open={open}
      onClose={toggleOpen}
      autoHideDuration={duration}
      key={anchor.vertical + anchor.horizontal}
      classes={{
        root: styles.snackbar,
      }}
    >
      <Alert
        onClose={toggleOpen}
        severity={severity}
        variant="filled"
        classes={{
          root: styles.alertRoot,
          colorSuccess: styles.colorSuccess,
          colorError: styles.colorError,
        }}
      >
        <Label
          variantSize="regular16"
          variantColor={severity === "success" ? "green" : "red"}
          label={text}
        />
      </Alert>
    </Snackbar>
  );
}
