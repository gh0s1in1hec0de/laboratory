import { Typography } from "@mui/material";
import { classNames } from "@/utils";
import styles from "./Label.module.scss";
import { LabelColors, LabelProps } from "./types";

export function Label({
  label,
  variantColor = LabelColors.White,
  variantSize: variant = "medium10",
  offUserSelect = false,
  className,
  disabled = false,
  ...props
}: LabelProps) {
  return (
    <Typography 
      className={classNames(
        styles.label,
        { 
          [styles.offUserSelect]: offUserSelect,
          [styles.disabled]: disabled
        },
        [
          styles[`${variant}`], 
          styles[variantColor], 
          className
        ])
      }
      {...props}
    >
      {label}
    </Typography>
  );
}
