import { CheckIcon } from "@/icons";
import { Checkbox } from "@headlessui/react";
import { CustomCheckboxProps } from "./types";
import styles from "./CustomCheckbox.module.scss";
import { classNames } from "@/utils";
import { Label } from "../Label";
import Grid from "@mui/material/Grid2";

export function CustomCheckbox({
  checked,
  onChange,
  label,
}: CustomCheckboxProps) {
  return (
    <Grid
      container
      gap={1}
      alignItems="center"
    >
      <Checkbox
        checked={checked}
        onChange={onChange}
        className={classNames(
          styles.checkbox,
          { [styles.checked]: checked },
        )}
      >
        <CheckIcon
          style={{
            display: checked ? "block" : "none",
          }}
        />
      </Checkbox>
      
      {label && <Label label={label} variantSize="regular16" offUserSelect />}
    </Grid>
  );
}
