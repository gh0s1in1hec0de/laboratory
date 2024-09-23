import { iconStyle, NavbarIconProps } from "../types";

export function ProfileIcon({ active = false }: NavbarIconProps){
  return (
    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle 
        style={iconStyle}
        cx="12" cy="12" r="8.9"
        stroke={active ? "var(--orange-regular)" : "var(--gray-regular)"}
      />
      <circle 
        style={iconStyle}
        cx="12" cy="9.14705" r="3" 
        stroke={active ? "var(--orange-regular)" : "var(--gray-regular)"}
        strokeLinecap="round"/>
      <path
        style={iconStyle}
        d="M18 17.853C17.6461 16.7898 16.8662 15.8503 15.7814 15.1803C14.6966 14.5102 13.3674 14.147 12 14.147C10.6326 14.147 9.30341 14.5102 8.21858 15.1803C7.13375 15.8503 6.35391 16.7898 6 17.853"
        stroke={active ? "var(--orange-regular)" : "var(--gray-regular)"}
        strokeLinecap="round"/>
    </svg>
  );
}
