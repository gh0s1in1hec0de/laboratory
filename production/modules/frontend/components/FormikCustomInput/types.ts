import { CustomInputProps } from "@/common/CustomInput";
import { ReactNode } from "react";

export interface FormikCustomInputProps extends Omit<CustomInputProps, "value" | "onChange" | "errorText"> {
  name: string;
  placeholder: string;
  type?: "text" | "email" | "password" | "number";
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  errorText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}
