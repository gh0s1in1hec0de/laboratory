export function ArrowDownIcon({ className, isRotate = false }: {className?: string; isRotate?: boolean}) {
  return (
    <svg style={{ transform: isRotate ? "rotate(180deg)" : undefined }} className={className} width="22px" height="22px" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.9188 8.17969H11.6888H6.07877C5.11877 8.17969 4.63877 9.33969 5.31877 10.0197L10.4988 15.1997C11.3288 16.0297 12.6788 16.0297 13.5088 15.1997L15.4788 13.2297L18.6888 10.0197C19.3588 9.33969 18.8788 8.17969 17.9188 8.17969Z" fill="var(--black-dark)"/>
    </svg>
  );
}
