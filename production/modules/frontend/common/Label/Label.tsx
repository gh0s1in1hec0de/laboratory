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
  isBold = false,
  isCursive = false,
  component = "span",
  ...props
}: LabelProps) {
  return (
    <Typography 
      component={component}
      className={classNames(
        styles.label,
        { 
          [styles.offUserSelect]: offUserSelect,
          [styles.disabled]: disabled,
          [styles.bold]: isBold,
          [styles.cursive]: isCursive,
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
