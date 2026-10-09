/**
 * Reine Logik des Lebensmittel-Formulars (PROJ-2): Formularwerte sind Texte,
 * geprüft wird mit demselben `foodInputSchema` wie in der Datenschicht.
 * Keine UI, keine Navigation — dadurch per Jest testbar.
 */
import type { FieldErrors, Resolver } from "react-hook-form";

import {
  createFood,
  deleteFood,
  foodInputSchema,
  getFood,
  parseDecimal,
  updateFood,
  type Food,
  type FoodField,
  type FoodInput,
  type ParsedFoodInput,
} from "@/lib/foods";

import { formatAmount } from "./format";

/** Formularwerte wie getippt; `barcode` ist nur anzeig- und entfernbar. */
export type FoodFormValues = {
  name: string;
  kcal: string;
  carbs: string;
  fat: string;
  protein: string;
  pieceGrams: string;
  barcode: string | null;
};

export type FoodFieldErrors = Partial<Record<FoodField, string>>;

export type InitialFoodForm = { mode: "create"; values: FoodFormValues } | { mode: "edit"; id: number };

export type LoadOutcome =
  | { status: "ready"; values: FoodFormValues }
  | { status: "not_found"; message: string }
  | { status: "error"; message: string };

export type SaveOutcome =
  | { status: "saved" }
  /** Beim Bearbeiten inzwischen gelöscht → Hinweis, Sheet schließt. */
  | { status: "not_found"; message: string }
  /** `barcode_taken` / `db` → Hinweis oben im Formular, Sheet bleibt offen. */
  | { status: "banner"; message: string }
  /** `validation` → Fehler am Feld. */
  | { status: "fields"; fieldErrors: FoodFieldErrors };

export type DeleteOutcome = { status: "deleted" } | { status: "banner"; message: string };

/** Felder mit Texteingabe (Reihenfolge = Fokus-Reihenfolge). */
export const FOOD_TEXT_FIELDS = ["name", "kcal", "carbs", "fat", "protein", "pieceGrams"] as const;
export type FoodTextField = (typeof FOOD_TEXT_FIELDS)[number];

export function emptyFoodFormValues(): FoodFormValues {
  return { name: "", kcal: "", carbs: "", fat: "", protein: "", pieceGrams: "", barcode: null };
}

export function foodToFormValues(food: Food): FoodFormValues {
  return {
    name: food.name,
    kcal: formatAmount(food.kcal),
    carbs: formatAmount(food.carbs),
    fat: formatAmount(food.fat),
    protein: formatAmount(food.protein),
    pieceGrams: food.pieceGrams === null ? "" : formatAmount(food.pieceGrams),
    barcode: food.barcode,
  };
}

/** Leer → `null` (Pflichtfeld bzw. „kein Stückgewicht“), sonst Zahl; unlesbar → NaN (Schema meldet „Bitte eine Zahl eingeben“). */
function toNumber(text: string): number | null {
  if (text.trim() === "") return null;
  return parseDecimal(text) ?? Number.NaN;
}

export function toFoodInput(values: FoodFormValues): FoodInput {
  // Pflichtfelder dürfen hier `null` sein — das Schema meldet dann „Pflichtfeld“.
  return {
    name: values.name,
    kcal: toNumber(values.kcal) as number,
    carbs: toNumber(values.carbs) as number,
    fat: toNumber(values.fat) as number,
    protein: toNumber(values.protein) as number,
    pieceGrams: toNumber(values.pieceGrams),
    barcode: values.barcode,
  };
}

/** Prüft per `foodInputSchema`; erster Fehlertext je Feld. */
export function validateFoodForm(values: FoodFormValues): { input: ParsedFoodInput | null; errors: FoodFieldErrors } {
  const parsed = foodInputSchema.safeParse(toFoodInput(values));
  if (parsed.success) return { input: parsed.data, errors: {} };
  const errors: FoodFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as FoodField | undefined;
    if (field !== undefined && errors[field] === undefined) errors[field] = issue.message;
  }
  return { input: null, errors };
}

/**
 * Fehler, die am Feld angezeigt werden: sobald ein Feld Text enthält (live beim
 * Tippen) oder vom Nutzer geändert wurde (z. B. geleert). Unberührte leere
 * Pflichtfelder bleiben still — „Sichern“ ist trotzdem deaktiviert.
 */
export function visibleFieldErrors(
  values: FoodFormValues,
  changed: Partial<Record<FoodField, boolean>>,
): FoodFieldErrors {
  const { errors } = validateFoodForm(values);
  const visible: FoodFieldErrors = {};
  for (const field of FOOD_TEXT_FIELDS) {
    const message = errors[field];
    if (message !== undefined && (values[field].trim() !== "" || changed[field])) visible[field] = message;
  }
  return visible;
}

/** „Sichern“ nur bei gültigem Formular und nicht während des Speicherns. */
export function canSaveFoodForm(values: FoodFormValues, saving: boolean): boolean {
  return !saving && validateFoodForm(values).input !== null;
}

/** react-hook-form-Resolver auf Basis von `foodInputSchema` (ohne @hookform/resolvers). */
export const foodFormResolver: Resolver<FoodFormValues> = (values) => {
  const { input, errors } = validateFoodForm(values);
  if (input !== null) return { values, errors: {} };
  const fieldErrors: FieldErrors<FoodFormValues> = {};
  for (const [field, message] of Object.entries(errors) as [FoodField, string][]) {
    fieldErrors[field] = { type: "validation", message };
  }
  return { values: {}, errors: fieldErrors };
};

/** Route-Parameter → Startzustand: `id` = Bearbeiten, `name` = Neu vorausgefüllt, ohne = leer. */
export function initialFoodForm(params: { id?: string; name?: string }): InitialFoodForm {
  if (params.id !== undefined) {
    const id = /^\d+$/.test(params.id) ? Number(params.id) : Number.NaN;
    return { mode: "edit", id };
  }
  return { mode: "create", values: { ...emptyFoodFormValues(), name: params.name ?? "" } };
}

export async function loadFoodForm(id: number): Promise<LoadOutcome> {
  const { data, error } = await getFood(id);
  if (error) {
    return error.kind === "not_found"
      ? { status: "not_found", message: error.message }
      : { status: "error", message: error.message };
  }
  return { status: "ready", values: foodToFormValues(data) };
}

/** Neu (`id` = null) oder Bearbeiten sichern; übersetzt Fehler der Datenschicht in Formular-Reaktionen. */
export async function saveFoodForm(id: number | null, values: FoodFormValues): Promise<SaveOutcome> {
  const input = toFoodInput(values);
  const { error } = id === null ? await createFood(input) : await updateFood(id, input);
  if (!error) return { status: "saved" };
  switch (error.kind) {
    case "not_found":
      return { status: "not_found", message: error.message };
    case "validation":
      return { status: "fields", fieldErrors: error.fieldErrors ?? {} };
    default:
      return { status: "banner", message: error.message };
  }
}

export async function deleteFoodFromForm(id: number): Promise<DeleteOutcome> {
  const { error } = await deleteFood(id);
  return error ? { status: "banner", message: error.message } : { status: "deleted" };
}
