import { Field, Radio, RadioGroup } from "@headlessui/react";
import styles from "./CustomRadioGroup.module.scss";
import { CustomRadioGroupProps } from "./types";
import { Label } from "@/common/Label";
import { classNames } from "@/utils";
import { useTranslations } from "next-intl";

export function CustomRadioGroup<T>({
  options,
  selected,
  onChange,
}: CustomRadioGroupProps<T>) {
  const t = useTranslations();

  return (
    <RadioGroup
      className={styles.radioGroup}
      value={selected}
      onChange={onChange}
    >
      {options.map(({ label, value }) => (
        <Field
          key={label}
          className={styles.field}
        >
          <Radio
            value={value}
            className={classNames(
              styles.radio,
              { [styles.checked]: selected === value }
            )}
          >
            <span className={classNames(
              styles.radioIcon,
              { [styles.checked]: selected === value }
            )} />
          </Radio>

          {label && (
            <Label
              label={t(label)}
              variantSize="regular16"
              offUserSelect
            />
          )}
        </Field>
      ))}
    </RadioGroup>
  );
}
