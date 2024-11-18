export function ArrowDownDirectionIcon({ isRotate = false }: {isRotate?: boolean}) {
  return (
    <svg style={{ transform: isRotate ? "rotate(180deg)" : undefined }} width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.50006 0.25V11.75M6.50006 11.75C8.28209 8.40481 9.64882 7.43577 12.5001 6.75M6.50006 11.75C4.71803 8.40481 3.35124 7.43577 0.5 6.75" stroke="white" strokeLinejoin="bevel"/>
    </svg>
  );
}
