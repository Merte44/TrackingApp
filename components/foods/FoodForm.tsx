import { useRef } from "react";
import { Controller, type Control } from "react-hook-form";
import { Pressable, ScrollView, View, type TextInput } from "react-native";

import { SymbolIcon } from "@/components/common/SymbolIcon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

import { DecimalField } from "./DecimalField";
import type { FoodFieldErrors, FoodFormValues, FoodTextField } from "./foodFormValues";

interface FoodFormProps {
  control: Control<FoodFormValues>;
  /** Am Feld angezeigte Fehler (live geprüft bzw. von der Datenschicht). */
  errors: FoodFieldErrors;
  /** Aktueller Barcode (nur Anzeige); `null` blendet die Zeile aus. */
  barcode: string | null;
  onRemoveBarcode: () => void;
  /** Speicher-/Löschfehler oben im Formular. */
  banner: string | null;
  /** Nur Bearbeiten: „Lebensmittel löschen“ unten (Bestätigung macht der Aufrufer). */
  onDelete?: () => void;
  /** Sperrt Eingaben während Speichern/Löschen. */
  busy?: boolean;
}

type NumberFieldConfig = {
  name: Exclude<FoodTextField, "name" | "pieceGrams">;
  label: string;
  unit: string;
  tag: string;
  tagClassName?: string;
};

const NUTRIENT_FIELDS: NumberFieldConfig[] = [
  { name: "kcal", label: "Kalorien", unit: "kcal", tag: "" },
  { name: "carbs", label: "Kohlenhydrate", unit: "g", tag: "C", tagClassName: "text-carbs" },
  { name: "fat", label: "Fett", unit: "g", tag: "F", tagClassName: "text-fat" },
  { name: "protein", label: "Eiweiß", unit: "g", tag: "E", tagClassName: "text-protein" },
];

function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="mx-4 mt-4 text-footnote uppercase text-muted-foreground" accessibilityRole="header">
      {children}
    </Text>
  );
}

/**
 * Formular eines eigenen Lebensmittels: Name, Nährwerte pro 100 g, Stückgewicht,
 * Barcode (nur entfernbar), Fehlerhinweis oben, „Lebensmittel löschen“ unten.
 * Kennt keine Navigation und speichert nicht selbst.
 */
export function FoodForm({ control, errors, barcode, onRemoveBarcode, banner, onDelete, busy = false }: FoodFormProps) {
  const refs = useRef<Partial<Record<FoodTextField, TextInput | null>>>({});
  const focus = (field: FoodTextField) => refs.current[field]?.focus();

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-1.5 px-4 pb-8 pt-2"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      {banner ? (
        <View
          className="mb-2.5 flex-row items-start gap-2.5 rounded-lg border border-destructive bg-card px-3.5 py-3"
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <SymbolIcon name="exclamationmark.circle" size={20} className="text-destructive" />
          <Text className="flex-1 text-subhead text-foreground">{banner}</Text>
        </View>
      ) : null}

      <View className="rounded-lg bg-card px-4">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              ref={(el) => {
                field.ref(el);
                refs.current.name = el;
              }}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!busy}
              placeholder="Name"
              accessibilityLabel="Name"
              accessibilityHint={errors.name ? `Fehler: ${errors.name}` : undefined}
              autoCapitalize="sentences"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => focus("kcal")}
              className="h-11 border-0 bg-transparent px-0 py-0 text-body shadow-none dark:bg-transparent"
            />
          )}
        />
        {errors.name ? (
          <Text className="-mt-1.5 pb-2.5 text-footnote text-destructive" accessibilityLiveRegion="polite">
            {errors.name}
          </Text>
        ) : null}
      </View>

      <SectionHeader>Nährwerte pro 100 g</SectionHeader>
      <View className="rounded-lg bg-card pl-4">
        {NUTRIENT_FIELDS.map((config, index) => {
          const next: FoodTextField = index < NUTRIENT_FIELDS.length - 1 ? NUTRIENT_FIELDS[index + 1].name : "pieceGrams";
          return (
            <Controller
              key={config.name}
              control={control}
              name={config.name}
              render={({ field }) => (
                <DecimalField
                  inputRef={(el) => {
                    field.ref(el);
                    refs.current[config.name] = el;
                  }}
                  label={config.label}
                  unit={config.unit}
                  tag={config.tag}
                  tagClassName={config.tagClassName}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors[config.name]}
                  onNext={() => focus(next)}
                  showSeparator={index < NUTRIENT_FIELDS.length - 1}
                  indentError
                  editable={!busy}
                />
              )}
            />
          );
        })}
      </View>

      <SectionHeader>Stück</SectionHeader>
      <View className="rounded-lg bg-card pl-4">
        <Controller
          control={control}
          name="pieceGrams"
          render={({ field }) => (
            <DecimalField
              inputRef={(el) => {
                field.ref(el);
                refs.current.pieceGrams = el;
              }}
              label="Stückgewicht"
              unit="g"
              placeholder="optional"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.pieceGrams}
              editable={!busy}
              isLast
            />
          )}
        />
      </View>

      {barcode ? (
        <>
          <SectionHeader>Barcode</SectionHeader>
          <View className="min-h-11 flex-row items-center gap-2 rounded-lg bg-card pl-4 pr-2">
            <Text className="flex-1 text-body tabular-nums tracking-wide text-foreground" accessibilityLabel={`Barcode ${barcode}`}>
              {barcode}
            </Text>
            <Pressable
              onPress={onRemoveBarcode}
              disabled={busy}
              className="h-11 min-w-11 items-center justify-center px-2 active:opacity-50"
              accessibilityRole="button"
              accessibilityLabel="Barcode entfernen"
              accessibilityHint="Entfernt den Barcode beim Sichern"
            >
              <Text className="text-body text-destructive">Entfernen</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {onDelete ? (
        <Pressable
          onPress={onDelete}
          disabled={busy}
          className={cn("mt-6 min-h-11 items-center justify-center rounded-lg bg-card active:opacity-50", busy && "opacity-50")}
          accessibilityRole="button"
          accessibilityLabel="Lebensmittel löschen"
          accessibilityHint="Fragt nach, dann wird das Lebensmittel endgültig gelöscht"
        >
          <Text className="text-body text-destructive">Lebensmittel löschen</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
