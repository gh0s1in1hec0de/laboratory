export function LoupeIcon({ disabled = false }: { disabled?: boolean }) { 
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="6" stroke={disabled ? "var(--gray-dark)" : "var(--gray-light)"} />
      <path d="M15.5 15.5L19.1513 19.1513" stroke={disabled ? "var(--gray-dark)" : "var(--gray-light)"} strokeLinecap="round"/>
    </svg>
  );
}
