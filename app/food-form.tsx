import { usePreventRemove } from "@react-navigation/native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { useForm, useFormState, useWatch } from "react-hook-form";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FoodForm } from "@/components/foods/FoodForm";
import {
  canSaveFoodForm,
  deleteFoodFromForm,
  emptyFoodFormValues,
  foodFormResolver,
  initialFoodForm,
  loadFoodForm,
  saveFoodForm,
  visibleFieldErrors,
  type FoodFieldErrors,
  type FoodFormValues,
} from "@/components/foods/foodFormValues";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { FOOD_MESSAGES } from "@/lib/foods";
import { cn } from "@/lib/utils";

type LoadState = { status: "loading" } | { status: "ready" } | { status: "error"; message: string };

/** Feldfehler der Datenschicht gelten nur, solange die Werte unverändert sind. */
type ServerErrors = { values: FoodFormValues; errors: FoodFieldErrors };

function sameValues(a: FoodFormValues, b: FoodFormValues): boolean {
  return (Object.keys(a) as (keyof FoodFormValues)[]).every((key) => a[key] === b[key]);
}

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Formular-Sheet „Neues Lebensmittel“ / „Lebensmittel bearbeiten“.
 * Parameter: `id` → Bearbeiten, `name` → Neu (Name vorausgefüllt), ohne → leeres Neu-Formular.
 */
export default function FoodFormScreen() {
  // Route-Parameter sind untrusted (Deep-Link): nur einzelne Strings übernehmen.
  const params = useLocalSearchParams<{ id?: string | string[]; name?: string | string[] }>();
  const navigation = useNavigation();
  const [initial] = useState(() => initialFoodForm({ id: single(params.id), name: single(params.name) }));
  const editId = initial.mode === "edit" ? initial.id : null;

  const [load, setLoad] = useState<LoadState>(editId === null ? { status: "ready" } : { status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [savedName, setSavedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<ServerErrors | null>(null);

  const form = useForm<FoodFormValues>({
    defaultValues: initial.mode === "create" ? initial.values : emptyFoodFormValues(),
    resolver: foodFormResolver,
  });
  const watched = useWatch({ control: form.control });
  const values: FoodFormValues = { ...emptyFoodFormValues(), ...watched, barcode: watched.barcode ?? null };
  const { isDirty, dirtyFields } = useFormState({ control: form.control });

  // Bearbeiten: Lebensmittel laden.
  useEffect(() => {
    if (editId === null) return;
    let cancelled = false;
    loadFoodForm(editId).then((outcome) => {
      if (cancelled) return;
      if (outcome.status === "ready") {
        form.reset(outcome.values);
        setSavedName(outcome.values.name);
        setLoad({ status: "ready" });
      } else if (outcome.status === "not_found") {
        Alert.alert(outcome.message, undefined, [{ text: "OK", onPress: () => setClosing(true) }]);
      } else {
        setLoad({ status: "error", message: outcome.message });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editId, reloadKey, form]);

  // Abbrechen und Herunterwischen mit Änderungen abfangen (ohne Änderungen schließt das Sheet sofort).
  usePreventRemove(isDirty && !closing, ({ data }) => {
    Alert.alert("Änderungen verwerfen?", "Deine Eingaben gehen verloren.", [
      { text: "Weiter bearbeiten", style: "cancel" },
      { text: "Verwerfen", style: "destructive", onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  // Nach Sichern/Löschen bzw. „nicht mehr vorhanden“ schließen — ohne Verwerfen-Dialog
  // (`closing` hebt die Sperre oben auf, bevor zurück navigiert wird).
  useEffect(() => {
    if (closing) router.back();
  }, [closing]);

  const busy = saving || deleting || closing;
  const ready = load.status === "ready";
  const canSave = ready && !busy && canSaveFoodForm(values, saving);
  const errors: FoodFieldErrors = {
    ...(serverErrors && sameValues(serverErrors.values, values) ? serverErrors.errors : {}),
    ...visibleFieldErrors(values, dirtyFields),
  };

  const save = form.handleSubmit(async (submitted) => {
    setSaving(true);
    setBanner(null);
    setServerErrors(null);
    try {
      const outcome = await saveFoodForm(editId, submitted);
      switch (outcome.status) {
        case "saved":
          setClosing(true);
          return;
        case "not_found":
          Alert.alert(outcome.message, undefined, [{ text: "OK", onPress: () => setClosing(true) }]);
          return;
        case "fields":
          setServerErrors({ values: submitted, errors: outcome.fieldErrors });
          break;
        case "banner":
          setBanner(outcome.message);
          break;
      }
    } catch {
      setBanner(FOOD_MESSAGES.save_failed);
    }
    setSaving(false);
  });

  const remove = async () => {
    if (editId === null) return;
    setDeleting(true);
    setBanner(null);
    const outcome = await deleteFoodFromForm(editId);
    if (outcome.status === "deleted") {
      setClosing(true);
      return;
    }
    setBanner(outcome.message);
    setDeleting(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Lebensmittel löschen?",
      `„${savedName}“ wird endgültig gelöscht. Bereits eingetragene Tage bleiben unverändert.`,
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Löschen", style: "destructive", onPress: remove },
      ],
    );
  };

  const title = editId === null ? "Neues Lebensmittel" : "Lebensmittel bearbeiten";

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-background">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="h-12 flex-row items-center justify-between px-2">
          <Pressable
            onPress={() => router.back()}
            className="h-11 min-w-11 items-center justify-center px-2 active:opacity-50"
            accessibilityRole="button"
            accessibilityLabel="Abbrechen"
            accessibilityHint="Schließt das Formular; bei Änderungen wird nachgefragt"
          >
            <Text className="text-body text-primary">Abbrechen</Text>
          </Pressable>
          <Text className="text-headline font-semibold text-foreground" accessibilityRole="header">
            {title}
          </Text>
          <Pressable
            onPress={save}
            disabled={!canSave}
            className="h-11 min-w-11 items-center justify-center px-2 active:opacity-50"
            accessibilityRole="button"
            accessibilityLabel="Sichern"
            accessibilityHint="Speichert das Lebensmittel und schließt das Formular"
            accessibilityState={{ disabled: !canSave, busy: saving }}
          >
            <Text
              className={cn("text-headline font-semibold", canSave ? "text-primary" : "text-muted-foreground opacity-60")}
            >
              Sichern
            </Text>
          </Pressable>
        </View>

        {load.status === "loading" ? (
          <View className="flex-1 items-center justify-center pb-40">
            <ActivityIndicator accessibilityLabel="Lebensmittel wird geladen" />
          </View>
        ) : load.status === "error" ? (
          <View className="flex-1 items-center justify-center gap-3 px-10 pb-40">
            <Text className="text-center text-title3 font-semibold text-foreground" accessibilityRole="header">
              {load.message}
            </Text>
            <Button
              variant="ghost"
              onPress={() => {
                setLoad({ status: "loading" });
                setReloadKey((k) => k + 1);
              }}
              className="mt-2 h-11 px-4"
              accessibilityLabel="Erneut versuchen"
              accessibilityHint="Lädt das Lebensmittel neu"
            >
              <Text className="text-headline font-semibold text-primary">Erneut versuchen</Text>
            </Button>
          </View>
        ) : (
          <FoodForm
            control={form.control}
            errors={errors}
            barcode={values.barcode}
            onRemoveBarcode={() => form.setValue("barcode", null, { shouldDirty: true })}
            banner={banner}
            onDelete={editId === null ? undefined : confirmDelete}
            busy={busy}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
