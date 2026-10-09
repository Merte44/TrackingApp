import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { cssInterop } from "nativewind";

/**
 * SF Symbol mit Token-Farbe per `className` (z. B. `text-primary`) — `SymbolView`
 * nimmt die Farbe nur als `tintColor`-Prop; cssInterop reicht die Textfarbe der
 * Klasse dorthin durch, damit nie Hex in Komponenten steht.
 */
cssInterop(SymbolView, {
  className: { target: "style", nativeStyleToProp: { color: "tintColor" } },
});

interface SymbolIconProps extends Omit<SymbolViewProps, "tintColor" | "size"> {
  className?: string;
  /** Kantenlänge in pt */
  size?: number;
}

/** Dekoratives Symbol; Bedeutung trägt das umgebende Element (accessibilityLabel). */
export function SymbolIcon({ size = 22, ...props }: SymbolIconProps) {
  return <SymbolView size={size} accessible={false} importantForAccessibility="no" {...props} />;
}
