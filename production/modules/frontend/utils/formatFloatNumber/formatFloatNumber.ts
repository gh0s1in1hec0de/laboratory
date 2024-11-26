export function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3);
}
