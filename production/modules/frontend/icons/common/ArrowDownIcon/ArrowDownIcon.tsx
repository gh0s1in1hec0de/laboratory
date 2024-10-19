export function ArrowDownIcon({ className, isRotate = false }: {className?: string; isRotate?: boolean}) {
  return (
    <svg style={{ transform: isRotate ? "rotate(180deg)" : undefined }} className={className} width="14px" height="14px" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.9201 8.94995L13.4001 15.47C12.6301 16.24 11.3701 16.24 10.6001 15.47L4.08008 8.94995" stroke="var(--black-dark)" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
