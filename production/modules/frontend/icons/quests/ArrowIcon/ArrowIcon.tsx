export function ArrowIcon({ className, isRotate = false }: {className?: string; isRotate?: boolean}) {
  return (
    <svg style={{ transform: isRotate ? "rotate(180deg)" : undefined }} className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.6667C20.1984 13.581 18.3761 14.8731 16 19.3333C13.624 14.8731 11.8016 13.581 8 12.6667" stroke="white" strokeLinejoin="bevel"/>
    </svg>
  );
}
