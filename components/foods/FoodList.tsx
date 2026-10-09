import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";

import { SymbolIcon } from "@/components/common/SymbolIcon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { foodListCreateName, useFoods } from "@/hooks/useFoods";
import { deleteFood, type Food } from "@/lib/foods";

import { FoodEmptyState } from "./FoodEmptyState";
import { FoodRow } from "./FoodRow";

interface FoodListProps {
  /** Suchbegriff (Teilstring, unabhängig von Groß-/Kleinschreibung und Umlauten). */
  query: string;
  /** Tipp auf eine Zeile. */
  onSelect: (food: Food) => void;
  /** „Neues Lebensmittel“ im Leer- bzw. Kein-Treffer-Zustand; bekommt den Suchbegriff des angezeigten Ergebnisses (leer im Leerzustand). */
  onCreate: (query: string) => void;
  /** VoiceOver-Hinweis für den Tipp auf eine Zeile. */
  selectHint?: string;
}

/**
 * Eigene Lebensmittel als gruppierte Liste mit Lade-, Fehler-, Leer- und
 * Kein-Treffer-Zustand und Wisch-Löschen. Kennt keine Navigation.
 */
export function FoodList({ query, onSelect, onCreate, selectHint = "Öffnet das Lebensmittel" }: FoodListProps) {
  const foodsState = useFoods(query);
  const { foods, view, reload } = foodsState;

  const remove = async (food: Food) => {
    // Sofort, ohne Rückfrage; die Liste lädt über subscribeFoods neu.
    const { error } = await deleteFood(food.id);
    if (error) Alert.alert(error.message);
  };

  if (view === "loading") {
    return (
      <View className="flex-1 items-center justify-center pb-40">
        <ActivityIndicator accessibilityLabel="Lebensmittel werden geladen" />
      </View>
    );
  }

  if (view === "error") {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-10 pb-40">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
          <SymbolIcon name="exclamationmark.triangle" size={28} className="text-destructive" />
        </View>
        <Text className="text-center text-title3 font-semibold text-foreground" accessibilityRole="header">
          Lebensmittel konnten nicht geladen werden
        </Text>
        <Button
          variant="ghost"
          onPress={reload}
          className="mt-2 h-11 px-4"
          accessibilityLabel="Erneut versuchen"
          accessibilityHint="Lädt die eigenen Lebensmittel neu"
        >
          <Text className="text-headline font-semibold text-primary">Erneut versuchen</Text>
        </Button>
      </View>
    );
  }

  if (view === "empty" || view === "no_match") {
    // Suchbegriff des angezeigten Ergebnisses, nicht die (evtl. schon weitergetippte) Prop.
    return (
      <FoodEmptyState
        variant={view}
        query={foodsState.query}
        onCreate={() => onCreate(foodListCreateName(foodsState))}
      />
    );
  }

  return (
    <FlatList
      data={foods}
      keyExtractor={(food) => String(food.id)}
      renderItem={({ item }) => <FoodRow food={item} onPress={onSelect} onDelete={remove} selectHint={selectHint} />}
      ItemSeparatorComponent={RowSeparator}
      className="flex-1"
      contentContainerClassName="mx-4 mb-4 overflow-hidden rounded-lg bg-card"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    />
  );
}

/** Haarlinie, eingerückt wie der Zeilentext. */
function RowSeparator() {
  return (
    <View className="bg-card pl-4">
      <Separator style={{ height: StyleSheet.hairlineWidth }} />
    </View>
  );
}
