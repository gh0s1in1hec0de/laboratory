export interface CustomRadioGroupOption<T> {
  label: string;
  value: T;
}

export interface CustomRadioGroupProps<T> {
  options: CustomRadioGroupOption<T>[];
  selected: T;
  onChange: (value: T) => void;
}
