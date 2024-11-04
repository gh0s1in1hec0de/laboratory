import { ChangeEvent, ReactNode } from "react";

export interface CustomInputProps {
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "email" | "password";
  name?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  errorText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

