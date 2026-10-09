import { useRef } from "react";
import { Pressable, View } from "react-native";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import { SymbolIcon } from "@/components/common/SymbolIcon";
import { Text } from "@/components/ui/text";
import type { Food } from "@/lib/foods";

import { formatAmount } from "./format";

interface FoodRowProps {
  food: Food;
  onPress: (food: Food) => void;
  /** Wisch-Löschen: wird sofort ohne Rückfrage aufgerufen. */
  onDelete: (food: Food) => void;
  /** VoiceOver-Hinweis für den Tipp auf die Zeile (hängt vom Einsatzort ab). */
  selectHint: string;
}

/** Zeile „Name / kcal · C · F · E pro 100 g“; nach links wischen zeigt den roten Papierkorb. */
export function FoodRow({ food, onPress, onDelete, selectHint }: FoodRowProps) {
  const swipeRef = useRef<SwipeableMethods | null>(null);
  const kcal = formatAmount(food.kcal);
  const carbs = formatAmount(food.carbs);
  const fat = formatAmount(food.fat);
  const protein = formatAmount(food.protein);

  const remove = () => {
    swipeRef.current?.close();
    onDelete(food);
  };

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          onPress={remove}
          className="w-20 items-center justify-center bg-destructive active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Löschen"
          accessibilityHint={`Löscht „${food.name}“ endgültig`}
        >
          <SymbolIcon name="trash.fill" size={22} className="text-destructive-foreground" />
        </Pressable>
      )}
    >
      <Pressable
        onPress={() => onPress(food)}
        className="min-h-[60px] flex-row items-center bg-card pl-4 active:bg-muted"
        accessibilityRole="button"
        accessibilityLabel={`${food.name}, ${kcal} Kilokalorien, Kohlenhydrate ${carbs} Gramm, Fett ${fat} Gramm, Eiweiß ${protein} Gramm, pro 100 Gramm`}
        accessibilityHint={selectHint}
        accessibilityActions={[{ name: "delete", label: "Löschen" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "delete") onDelete(food);
        }}
      >
        <View className="flex-1 gap-0.5 py-2 pr-4">
          <Text className="text-headline font-semibold text-foreground" numberOfLines={2}>
            {food.name}
          </Text>
          <Text className="text-footnote tabular-nums text-muted-foreground">
            {kcal} kcal · <Text className="text-footnote font-semibold text-carbs">C</Text> {carbs} ·{" "}
            <Text className="text-footnote font-semibold text-fat">F</Text> {fat} ·{" "}
            <Text className="text-footnote font-semibold text-protein">E</Text> {protein} pro 100 g
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}
