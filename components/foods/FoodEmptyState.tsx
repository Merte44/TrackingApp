import { View } from "react-native";

import { SymbolIcon } from "@/components/common/SymbolIcon";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface FoodEmptyStateProps {
  /** `empty`: noch keine eigenen Lebensmittel · `no_match`: nichts passt zum Suchbegriff */
  variant: "empty" | "no_match";
  /** Aktueller Suchbegriff (nur für `no_match`). */
  query: string;
  onCreate: () => void;
}

/** Leer- bzw. Kein-Treffer-Zustand der Liste mit „Neues Lebensmittel“. */
export function FoodEmptyState({ variant, query, onCreate }: FoodEmptyStateProps) {
  const noMatch = variant === "no_match";
  const title = noMatch ? "Kein Lebensmittel gefunden" : "Noch keine eigenen Lebensmittel";
  const body = noMatch
    ? `„${query.trim()}“ als neues Lebensmittel anlegen? Der Name ist schon ausgefüllt.`
    : "Nährwerte pro 100 g einmal anlegen — beim Eintragen tippst du dann nur noch die Menge.";

  return (
    <View className="flex-1 items-center justify-center gap-3 px-10 pb-40">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SymbolIcon name={noMatch ? "magnifyingglass" : "carrot"} size={28} className="text-muted-foreground" />
      </View>
      <Text className="text-center text-title3 font-semibold text-foreground" accessibilityRole="header">
        {title}
      </Text>
      <Text className="text-center text-subhead text-muted-foreground">{body}</Text>
      <Button
        onPress={onCreate}
        className="mt-2 h-[50px] px-6"
        accessibilityLabel="Neues Lebensmittel"
        accessibilityHint={noMatch ? "Legt ein Lebensmittel mit dem Suchbegriff als Namen an" : "Legt ein eigenes Lebensmittel an"}
      >
        <Text className="text-headline font-semibold">Neues Lebensmittel</Text>
      </Button>
    </View>
  );
}
