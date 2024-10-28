import { MutableRefObject } from "react";

export interface UseInfinityScrollProps {
  callback?: () => void;
  triggerRef: MutableRefObject<HTMLElement>;
}
