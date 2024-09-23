import { iconStyle, NavbarIconProps } from "../types";

export function TokenIcon({ active = false }: NavbarIconProps){
  return (
    <svg width="24px" height="24px" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        style={iconStyle}
        cx="12.7501" cy="12" r="8.9"
        stroke={active ? "var(--orange-regular)" : "var(--gray-regular)"}
      />
      <path
        style={iconStyle}
        d="M9.65069 12C11.0122 11.3586 12.1086 10.2622 12.75 8.90069C13.3914 10.2622 14.4878 11.3586 15.8493 12C14.4878 12.6414 13.3914 13.7378 12.75 15.0993C12.1086 13.7378 11.0122 12.6414 9.65069 12Z"
        stroke={active ? "var(--orange-regular)" : "var(--gray-regular)"}
      />
    </svg>
  );
}
