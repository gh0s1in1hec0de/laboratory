import { ChangeEvent } from "react";

export interface CustomTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  name: string;
  errorText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  rows?: number;
  resize?: "none" | "vertical" | "horizontal";
}
