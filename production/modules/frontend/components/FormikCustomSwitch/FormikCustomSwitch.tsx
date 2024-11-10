import { CustomSwitch } from "@/common/CustomSwitch";
import { FormikCustomSwitchProps } from "./types";
import { useField } from "formik";
import { ChangeEvent } from "react";

export function FormikCustomSwitch({
  name,
  disabled,
  onChange,
}: FormikCustomSwitchProps) {
  const [
    { value },
    { touched, error, initialValue },
    { setValue, setTouched },
  ] = useField(name);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.target.checked);
    onChange?.(e.target.checked);
  }

  return (
    <CustomSwitch
      value={value}
      onChange={handleChange}
      disabled={disabled}
    />
  );
}
