import { CheckIcon } from "@/icons";
import { Checkbox } from "@headlessui/react";
import { CustomCheckboxProps } from "./types";

export function CustomCheckbox({ checked, onChange }: CustomCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "6px",
        backgroundColor: checked ? "var(--orange-regular)" : "rgba(255, 255, 255, 0.1)",
        padding: "0.25rem",
        boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      // className={`group ${checked ? "bg-white" : ""}`}
    >
      <CheckIcon
        style={{
          display: checked ? "block" : "none",
        }}
      />
    </Checkbox>
  );
}
