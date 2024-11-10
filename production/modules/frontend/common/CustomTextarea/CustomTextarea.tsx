"use client";

import { Textarea } from "@headlessui/react";
import { FormControl, FormHelperText } from "@mui/material";
import classNames from "classnames";
import { Label } from "../Label";
import styles from "./CustomTextarea.module.scss";
import { CustomTextareaProps } from "./types";
import { useTranslations } from "next-intl";
import { ChangeEvent } from "react";

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
  const t = useTranslations("");
  
  function handleChangeValue(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
  }
  
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
        onChange={handleChangeValue}
        disabled={disabled}
        className={classNames(
          styles.textarea,
          { [styles.disabled]: disabled },
          [styles[`resize-${resize}`]],
        )}
      />
      {errorText && (
        <FormHelperText sx={{ paddingLeft: 1.5, paddingTop: 0.5 }}>
          <Label
            component="span"
            label={t(errorText)}
            variantSize="regular12"
            variantColor="red"
            disabled={disabled}
          />
        </FormHelperText>
      )}
    </FormControl>
  );
}
