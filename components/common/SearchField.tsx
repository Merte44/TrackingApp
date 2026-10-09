import { Pressable, View } from "react-native";

import { SymbolIcon } from "@/components/common/SymbolIcon";
import { Input } from "@/components/ui/input";

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel: string;
}

/** iOS-Suchfeld: Lupe, Eingabe, Leeren-Knopf sobald Text drinsteht. */
export function SearchField({ value, onChangeText, placeholder = "Suchen", accessibilityLabel }: SearchFieldProps) {
  return (
    <View className="h-9 flex-row items-center gap-1.5 rounded-md bg-input px-2">
      <SymbolIcon name="magnifyingglass" size={16} className="text-muted-foreground" />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="search"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        className="h-9 flex-1 border-0 bg-transparent px-0 py-0 text-body shadow-none dark:bg-transparent"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          className="h-7 w-7 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Suche leeren"
          accessibilityHint="Entfernt den Suchbegriff"
        >
          <SymbolIcon name="xmark.circle.fill" size={17} className="text-muted-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}
