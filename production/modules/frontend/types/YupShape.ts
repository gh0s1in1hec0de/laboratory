import { ObjectShape } from "yup";

export type YupShape<T extends Record<string, any>> = {
  [k in keyof T]: ObjectShape[string];
}
