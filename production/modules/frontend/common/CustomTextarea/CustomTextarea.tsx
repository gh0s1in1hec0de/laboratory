"use client";

import { Textarea } from "@headlessui/react";
import { FormControl, FormHelperText } from "@mui/material";
import classNames from "classnames";
import { Label } from "../Label";
import styles from "./CustomTextarea.module.scss";
import { CustomTextareaProps } from "./types";

export function CustomTextarea({
  placeholder,
  value,
  onChange,
  errorText,
  disabled,
  fullWidth = true,
  rows = 5,
  name,
  resize = "none",
}: CustomTextareaProps) {
  return (
    <FormControl
      className={classNames(
        styles.formControl,
        { [styles.fullWidth]: fullWidth },
      )}
      error={!!errorText}
    >
      <Textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={classNames(
          styles.textarea,
          { [styles.disabled]: disabled },
          [styles[`resize-${resize}`]],
        )}
      />

      <FormHelperText sx={{ paddingLeft: 1.5 }}>
        <Label
          component="span"
          label={errorText || ""}
          variantSize="medium10"
          variantColor="red"
          disabled={disabled}
        />
      </FormHelperText>
    </FormControl>
  );
}
