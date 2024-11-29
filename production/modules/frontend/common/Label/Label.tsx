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
  component = "p",
  cropped = false,
  customHref,
  target,
  ...props
}: LabelProps) {
  return (
    <Typography 
      component={component}
      href={customHref}
      target={target}
      className={classNames(
        styles.label,
        { 
          [styles.offUserSelect]: offUserSelect,
          [styles.disabled]: disabled,
          [styles.bold]: isBold,
          [styles.cursive]: isCursive,
          [styles.cropped]: cropped,
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
