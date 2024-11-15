export function TwitterIcon({ disabled }: {disabled?: boolean}) {
  return (
    <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.3822 0.898438H13.4522L8.92989 6.06782L14.25 13.1015H10.0841L6.82145 8.83591L3.08768 13.1015H1.01649L5.85348 7.57279L0.75 0.898438H5.02133L7.97052 4.79783L11.3822 0.898438ZM10.6555 11.8625H11.8029L4.39837 2.07272H3.16735L10.6555 11.8625Z" fill={disabled ? "var(--gray-dark)" : "var(--white-regular)"}/>
    </svg>
  );
}
