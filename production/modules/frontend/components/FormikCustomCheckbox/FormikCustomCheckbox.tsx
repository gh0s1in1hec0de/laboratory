import { CustomCheckbox } from "@/common/CustomCheckbox";
import { useField } from "formik";
import { FormikCustomCheckboxProps } from "./types";

export function FormikCustomCheckbox({ name }: FormikCustomCheckboxProps) {
  const [{ value }, { touched, error }, { setValue }] = useField(name);
  
  // function handlerChange(e: boolean) {
  //   setTouched(true);
  //   setValue(e);
  // }

  return (
    <CustomCheckbox
      checked={value}
      onChange={setValue}
    />
  );
}
