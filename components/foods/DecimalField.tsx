import { useId, type Ref } from "react";
import { InputAccessoryView, Keyboard, Pressable, View, type TextInput } from "react-native";

import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface DecimalFieldProps {
  /** Beschriftung links, z. B. „Kohlenhydrate“. */
  label: string;
  /** Einheit rechts, z. B. „g“ oder „kcal“. */
  unit: string;
  /** Kürzel vor der Beschriftung (C / F / E), leer für keine. */
  tag?: string;
  /** Token-Farbklasse des Kürzels, z. B. `text-carbs`. */
  tagClassName?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  /** Platzhalter, z. B. „0“ oder „optional“. */
  placeholder?: string;
  /** Fehlertext direkt unter dem Feld. */
  error?: string;
  /** Letztes Feld: Leiste zeigt „Fertig“ statt „Weiter“. */
  isLast?: boolean;
  /** „Weiter“: nächstes Feld fokussieren. */
  onNext?: () => void;
  /** Trenner unter der Zeile (nicht beim letzten Eintrag einer Gruppe). */
  showSeparator?: boolean;
  /** Fehlertext eingerückt hinter das Kürzel (bei Zeilen mit Kürzel-Spalte). */
  indentError?: boolean;
  /** `false` sperrt die Eingabe (z. B. während des Speicherns). */
  editable?: boolean;
  inputRef?: Ref<TextInput>;
}

/**
 * Zahlenzeile „[Kürzel] Beschriftung … Wert Einheit“ mit `decimal-pad`.
 * Das iOS-Zahlenfeld hat keine Eingabetaste — deshalb eine Tastatur-Leiste
 * (`InputAccessoryView`) mit „Weiter“ bzw. „Fertig“ im letzten Feld.
 */
export function DecimalField({
  label,
  unit,
  tag,
  tagClassName,
  value,
  onChangeText,
  onBlur,
  placeholder = "0",
  error,
  isLast = false,
  onNext,
  showSeparator = false,
  indentError = false,
  editable = true,
  inputRef,
}: DecimalFieldProps) {
  const accessoryId = useId();
  const hasTag = tag !== undefined;
  const action = isLast ? "Fertig" : "Weiter";

  const next = () => {
    if (isLast || !onNext) Keyboard.dismiss();
    else onNext();
  };

  return (
    <View className={cn("pr-4", showSeparator && "border-b border-hairline border-border")}>
      <View className="min-h-11 flex-row items-center gap-2">
        {hasTag ? (
          <Text className={cn("w-3.5 text-footnote font-bold", tagClassName)} accessible={false}>
            {tag}
          </Text>
        ) : null}
        <Text className="flex-1 text-body text-foreground" accessible={false}>
          {label}
        </Text>
        <Input
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          editable={editable}
          placeholder={placeholder}
          keyboardType="decimal-pad"
          inputAccessoryViewID={accessoryId}
          selectTextOnFocus
          accessibilityLabel={`${label} in ${unit === "g" ? "Gramm" : unit === "kcal" ? "Kilokalorien" : unit}`}
          accessibilityHint={error ? `Fehler: ${error}` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-11 min-w-20 flex-none border-0 bg-transparent px-0 py-0 text-right text-body tabular-nums shadow-none dark:bg-transparent",
            error ? "text-destructive" : "text-foreground",
          )}
        />
        <Text className="w-[30px] text-subhead text-muted-foreground" accessible={false}>
          {unit}
        </Text>
      </View>
      {error ? (
        <Text
          className={cn("-mt-1.5 pb-2.5 text-footnote text-destructive", hasTag && indentError && "ml-[22px]")}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
      <InputAccessoryView nativeID={accessoryId}>
        <View className="h-11 flex-row items-center justify-end border-t border-hairline border-border bg-muted px-2">
          <Pressable
            onPress={next}
            className="h-11 min-w-11 items-center justify-center px-2 active:opacity-50"
            accessibilityRole="button"
            accessibilityLabel={action}
            accessibilityHint={isLast ? "Schließt die Tastatur" : "Springt zum nächsten Feld"}
          >
            <Text className="text-headline font-semibold text-primary">{action}</Text>
          </Pressable>
        </View>
      </InputAccessoryView>
    </View>
  );
}
