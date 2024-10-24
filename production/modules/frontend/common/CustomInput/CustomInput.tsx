"use client";

import { FormControl, FormHelperText, Input, InputAdornment } from "@mui/material";
import styles from "./CustomInput.module.scss";
import { CustomInputProps, AdornmentVariant } from "./types";
import { LoupeIcon } from "@/icons";
import { classNames } from "@/utils";
import { Label } from "../Label";

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

  function renderAdornment(adornment: `${AdornmentVariant}` | undefined, position: "start" | "end") {
    if (adornment === AdornmentVariant.LOUPE) {
      return (
        <InputAdornment position={position}>
          <LoupeIcon disabled={disabled} />
        </InputAdornment>
      );
    }
    return undefined;
  }
  
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
        startAdornment={renderAdornment(startAdornment, "start")}
        endAdornment={renderAdornment(endAdornment, "end")}
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
