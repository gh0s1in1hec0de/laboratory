"use client";

import { classNames } from "@/utils";
import { FormControl, FormHelperText, Input, InputAdornment, Box } from "@mui/material";
import { Label } from "../Label";
import styles from "./CustomInput.module.scss";
import { CustomInputProps } from "./types";

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
}: CustomInputProps) {
  return (
    <FormControl
      className={classNames(styles.formControl, {
        [styles.fullWidth]: fullWidth,
      })}
      error={!!errorText}
    >
      <Input
        placeholder={placeholder}
        type={type}
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        startAdornment={(
          <InputAdornment position="start">
            {startAdornment}
          </InputAdornment>
        )}
        endAdornment={
          <InputAdornment position="end" style={{ display: "flex", alignItems: "center" }}>
            <Box style={{ backgroundColor: "var(--gray-dark)", height: "16px", width: "1px" }} />
            {endAdornment}
          </InputAdornment>
        }
        classes={{
          root: styles.root,
          input: styles.input,
          disabled: styles.disabled,
        }}
      />

      <FormHelperText>
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
