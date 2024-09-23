import { AnyFunction } from "@/utils";
import { useRef, useEffect, useCallback } from "react";

type Timeout = ReturnType<typeof setTimeout>;

export function useDebounce(
  callback: AnyFunction,
  [delay, isActive = true]: [number, boolean?],
) {
  const timer = useRef<Timeout | null>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    if (isActive) {
      timer.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }
  }, [callback, delay, isActive]);

  useEffect(() => {
    if (!isActive && timer.current) {
      clearTimeout(timer.current);
    }
  }, [isActive]);

  return debouncedCallback;
}
