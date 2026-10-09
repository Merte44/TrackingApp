/** Zahl mit Dezimalkomma, wie eingegeben (52 → „52“, 11.4 → „11,4“). */
export function formatAmount(value: number): string {
  return String(value).replace(".", ",");
}
