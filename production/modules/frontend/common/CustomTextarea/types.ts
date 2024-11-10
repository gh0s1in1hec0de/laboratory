export interface CustomTextareaProps {
  value: string;
  onChange: (e: string) => void;
  placeholder: string;
  name: string;
  errorText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  rows?: number;
  resize?: "none" | "vertical" | "horizontal";
}
