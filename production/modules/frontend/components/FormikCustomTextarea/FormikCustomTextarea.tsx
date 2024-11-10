import { CustomTextarea } from "@/common/CustomTextarea";
import { FormikCustomTextareaProps } from "./types";
import { useField } from "formik";
import { ChangeEvent } from "react";

export function FormikCustomTextarea({
  name,
  placeholder,
  errorText,
  disabled,
  fullWidth,
  rows,
  resize,
}: FormikCustomTextareaProps) {
  const [
    { value },
    { touched, error, initialValue },
    { setValue, setTouched },
  ] = useField(name);

  function handleChangeValue(e: ChangeEvent<HTMLTextAreaElement>) {
    // setTouched(true);
    setValue(e.target.value);
  }

  return (
    <CustomTextarea
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={handleChangeValue}
      errorText={errorText}
      disabled={disabled}
      fullWidth={fullWidth}
      rows={rows}
      resize={resize}
    />
  );
}
