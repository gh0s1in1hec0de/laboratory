import { ChangeEvent } from "react";

export enum AdornmentVariant {
  LOUPE = "loupe",
}

export interface CustomInputProps {
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "email" | "password";
  name?: string;
  startAdornment?: `${AdornmentVariant}`;
  endAdornment?: `${AdornmentVariant}`;
  errorText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

