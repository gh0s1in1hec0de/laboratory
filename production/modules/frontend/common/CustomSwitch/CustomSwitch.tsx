"use client";

import { CustomSwitchProps } from "./types";
import styles from "./CustomSwitch.module.scss";
import { classNames } from "@/utils";
import { Switch } from "@mui/material";

export function CustomSwitch({
  value,
  onChange,
  disabled,
}: CustomSwitchProps) {
  return (
    <Switch
      checked={value}
      onChange={onChange}
      classes={{
        root: styles.root,
        switchBase: classNames(styles.switchBase, { [styles.disabled]: disabled }),
        thumb: styles.thumb,
        track: classNames(styles.track, { [styles.active]: value, [styles.noActive]: !value }),
        checked: classNames(styles.checked, { [styles.disabled]: disabled }),
        disabled: styles.disabled,
      }}
      disabled={disabled}
    />
  );
}
