import { formatDecimal } from "@/lib/foods";

/** Zahl mit Dezimalkomma, ohne Exponent (52 → „52“, 11.4 → „11,4“, 0.0000001 → „0,0000001“). */
export function formatAmount(value: number): string {
  return formatDecimal(value);
}
