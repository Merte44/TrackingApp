import { router, type Href } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SearchField } from "@/components/common/SearchField";
import { SymbolIcon } from "@/components/common/SymbolIcon";
import { FoodList } from "@/components/foods/FoodList";
import { Text } from "@/components/ui/text";
import type { Food } from "@/lib/foods";

/** Formular-Sheet: `id` → Bearbeiten, `name` → Neu (vorausgefüllt), ohne → leeres Neu-Formular. */
function openForm(params?: { id: string } | { name: string }) {
  // TODO(PROJ-2 T4): app/food-form.tsx entsteht in T4; bis dahin kennen die typed routes
  // die Route nicht — der Cast kann weg, sobald sie existiert.
  router.push({ pathname: "/food-form", params } as unknown as Href);
}

/**
 * Vorläufiger Listen-Screen der eigenen Lebensmittel (formSheet).
 * PROJ-3 ersetzt ihn durch den Reiter „Lebensmittel“ im Hinzufügen-Sheet.
 */
export default function FoodsScreen() {
  const [query, setQuery] = useState("");

  const create = (search: string) => {
    const name = search.trim();
    openForm(name ? { name } : undefined);
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="h-12 flex-row items-center justify-between pl-4 pr-2">
          <View className="w-11" />
          <Text className="text-headline font-semibold text-foreground" accessibilityRole="header">
            Eigene Lebensmittel
          </Text>
          <Pressable
            onPress={() => create("")}
            className="h-11 w-11 items-center justify-center active:opacity-50"
            accessibilityRole="button"
            accessibilityLabel="Neues Lebensmittel"
            accessibilityHint="Legt ein eigenes Lebensmittel an"
          >
            <SymbolIcon name="plus" size={22} weight="semibold" className="text-primary" />
          </Pressable>
        </View>
        <View className="px-4 pb-3">
          <SearchField value={query} onChangeText={setQuery} accessibilityLabel="Lebensmittel suchen" />
        </View>
        <FoodList
          query={query}
          onSelect={(food: Food) => openForm({ id: String(food.id) })}
          onCreate={create}
          selectHint="Öffnet das Lebensmittel zum Bearbeiten"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
