import { CustomTextareaProps } from "@/common/CustomTextarea";

export interface FormikCustomTextareaProps extends Omit<CustomTextareaProps, "value" | "onChange"> {
  name: string;
  placeholder: string;
  errorText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  rows?: number;
  resize?: "none" | "vertical" | "horizontal";
}

