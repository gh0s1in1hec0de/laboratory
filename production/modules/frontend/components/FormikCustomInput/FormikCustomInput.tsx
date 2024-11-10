import { CustomInput } from "@/common/CustomInput";
import { FormikCustomInputProps } from "./types";
import { useField } from "formik";

export function FormikCustomInput({
  name,
  placeholder,
  type,
  startAdornment,
  endAdornment,
  disabled,
  fullWidth,
}: FormikCustomInputProps) {
  const [
    { value },
    { touched, error, initialValue },
    { setValue, setTouched },
  ] = useField(name);

  // function handlerChange(e: string) {
  //   setTouched(true);
  //   setValue(e);
  // }

  return (
    <CustomInput
      placeholder={placeholder}
      value={value}
      onChange={setValue}
      disabled={disabled}
      errorText={error}
      fullWidth={fullWidth}
      type={type}
      startAdornment={startAdornment}
      endAdornment={endAdornment}
      name={name}
    />
  );
}
