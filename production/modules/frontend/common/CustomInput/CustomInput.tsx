"use client";

import { classNames } from "@/utils";
import { FormControl, FormHelperText, Input, InputAdornment, Box } from "@mui/material";
import { Label } from "../Label";
import styles from "./CustomInput.module.scss";
import { CustomInputProps } from "./types";
import { ChangeEvent } from "react";
import { useTranslations } from "next-intl";

export function CustomInput({
  placeholder,
  type = "text",
  name,
  value,
  onChange,
  startAdornment,
  endAdornment,
  errorText,
  disabled,
  fullWidth = true,
  disableBigFloat = false,
}: CustomInputProps) {
  const t = useTranslations("");

  function handleChangeValue(e: ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;

    if (disableBigFloat && type === "number") {
      value = value.replace(/[^0-9.,]/g, "");
      const [integer, decimal] = value.split(".");

      if (decimal && decimal.length > 3) {
        value = `${integer}.${decimal.slice(0, 3)}`;
      }
      
      // value = value.split(/[.,]/)[0];
    }

    onChange(value);
  }

  return (
    <FormControl
      className={classNames(
        styles.formControl,
        { [styles.fullWidth]: fullWidth },
      )}
      error={!!errorText}
    >
      <Input
        placeholder={placeholder}
        type={type}
        name={name}
        disabled={disabled}
        value={value}
        onChange={handleChangeValue}
        startAdornment={startAdornment && (
          <InputAdornment position="start">
            {startAdornment}
          </InputAdornment>
        )}
        endAdornment={endAdornment && (
          <InputAdornment position="end" className={styles.endAdornment}>
            <Box className={styles.divider} />
            {endAdornment}
          </InputAdornment>
        )}
        classes={{
          root: styles.root,
          input: styles.input,
          disabled: styles.disabled,
        }}
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
