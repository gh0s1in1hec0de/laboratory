import { ChangeEvent } from "react";

export interface CustomSwitchProps {
  value: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}
