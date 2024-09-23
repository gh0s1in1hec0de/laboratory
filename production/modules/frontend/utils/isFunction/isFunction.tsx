import { AnyFunction } from "./types";

export function isFunction(value: unknown): value is AnyFunction {
  return typeof value === "function";
}
