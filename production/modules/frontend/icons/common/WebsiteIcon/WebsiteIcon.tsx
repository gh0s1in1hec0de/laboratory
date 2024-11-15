export function WebsiteIcon({ disabled }: {disabled?: boolean}) {
  return (
    <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.5 8H4.38889M0.5 8C0.5 11.866 3.63401 15 7.5 15M0.5 8C0.5 4.13401 3.63401 1 7.5 1M4.38889 8H10.6111M4.38889 8C4.38889 11.866 5.78178 15 7.5 15M4.38889 8C4.38889 4.13401 5.78178 1 7.5 1M10.6111 8H14.5M10.6111 8C10.6111 4.13401 9.21822 1 7.5 1M10.6111 8C10.6111 11.866 9.21822 15 7.5 15M14.5 8C14.5 4.13401 11.366 1 7.5 1M14.5 8C14.5 11.866 11.366 15 7.5 15" stroke={disabled ? "var(--gray-dark)" : "var(--white-regular)"} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
