import { CSSProperties } from "react";

export function CheckIcon({ style }: { style: CSSProperties }) {
  return (
    <svg
      width="12px"
      height="12px"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <path d="M1 4.5L4 7.5L9 2.5" stroke="var(--white-regular)" strokeWidth="1.2" />
    </svg>
  );
}
