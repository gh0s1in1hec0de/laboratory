import { CustomTextarea } from "@/common/CustomTextarea";
import { FormikCustomTextareaProps } from "./types";
import { useField } from "formik";

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

  function handleChangeValue(e: string) {
    setTouched(true);
    setValue(e);
  }

  return (
    <CustomTextarea
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={handleChangeValue}
      errorText={error && touched ? error : ""}
      disabled={disabled}
      fullWidth={fullWidth}
      rows={rows}
      resize={resize}
    />
  );
}
