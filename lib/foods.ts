/**
 * Eigene Lebensmittel (PROJ-2) — Data-Access-Schicht.
 *
 * Das Frontend greift nur über diese Funktionen auf die Tabelle `foods` zu.
 * Jede Funktion liefert `{ data, error }` und wirft nie; Fehler tragen eine Art
 * und einen deutschen Nutzertext. Schreibzugriffe prüfen vorher per Zod
 * (`foodInputSchema` — dasselbe Schema nutzt das Formular).
 */
import { z } from "zod";

import { getDb, type DbExecutor } from "./db";

// ---------------------------------------------------------------------------
// Typen

export type Food = {
  id: number;
  name: string;
  /** kcal pro 100 g */
  kcal: number;
  /** Kohlenhydrate (C) in g pro 100 g */
  carbs: number;
  /** Fett (F) in g pro 100 g */
  fat: number;
  /** Eiweiß (E) in g pro 100 g */
  protein: number;
  /** Stückgewicht in g, sonst `null` */
  pieceGrams: number | null;
  /** 8–14 Ziffern, sonst `null` */
  barcode: string | null;
};

export type FoodErrorKind = "validation" | "barcode_taken" | "not_found" | "db";

/** Felder von `FoodInput` — Schlüssel der Feldfehler. */
export type FoodField = "name" | "kcal" | "carbs" | "fat" | "protein" | "pieceGrams" | "barcode";

export type FoodError = {
  kind: FoodErrorKind;
  /** Nutzertext (Deutsch). */
  message: string;
  /** Nur bei `validation`: erster Fehlertext je Feld. */
  fieldErrors?: Partial<Record<FoodField, string>>;
};

export type FoodResult<T> = { data: T; error: null } | { data: null; error: FoodError };

export const FOOD_MESSAGES = {
  validation: "Bitte die markierten Felder prüfen.",
  not_found: "Lebensmittel nicht mehr vorhanden",
  save_failed: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
  delete_failed: "Löschen fehlgeschlagen. Bitte erneut versuchen.",
  load_failed: "Lebensmittel konnten nicht geladen werden.",
  barcodeTaken: (name: string) => `Dieser Barcode gehört schon zu „${name}“.`,
} as const;

/** Höchstzahl Zeilen je Liste/Trefferliste (Spec: Grenzen). */
export const FOODS_LIST_LIMIT = 500;

// ---------------------------------------------------------------------------
// Schema

/** Zahl mit deutschen Texten für fehlend (`undefined`/`null`) und unlesbar (NaN, ±∞, kein number). */
function numberField() {
  return z.number({
    error: (issue) =>
      issue.input === undefined || issue.input === null ? "Pflichtfeld" : "Bitte eine Zahl eingeben",
  });
}

const NEGATIVE = "Darf nicht negativ sein";
const macro = () => numberField().min(0, NEGATIVE).max(100, "Höchstens 100 g");

function formatGrams(value: number): string {
  return String(Math.round(value * 10) / 10).replace(".", ",");
}

/**
 * Eingabe eines eigenen Lebensmittels (pro 100 g). Formular und Datenschicht
 * nutzen dasselbe Schema. Ausgabe: Name getrimmt, leere optionale Felder `null`.
 *
 * Summenregel C + F + E ≤ 100 g meldet ihren Fehler am Feld `protein` (letztes
 * Feld, wie im Entwurf) — auch wenn andere Felder (z. B. Name) noch fehlerhaft sind.
 */
export const foodInputSchema = z
  .object({
    name: z
      .string({ error: "Bitte einen Namen eingeben" })
      .trim()
      .min(1, "Bitte einen Namen eingeben"),
    kcal: numberField().min(0, NEGATIVE).max(900, "Höchstens 900 kcal pro 100 g"),
    carbs: macro(),
    fat: macro(),
    protein: macro(),
    pieceGrams: numberField()
      .gt(0, "Muss größer als 0 g sein")
      .nullish()
      .transform((v) => v ?? null),
    barcode: z
      .string({ error: "Barcode muss aus 8–14 Ziffern bestehen" })
      .regex(/^(\d{8,14})?$/, "Barcode muss aus 8–14 Ziffern bestehen")
      .nullish()
      .transform((v) => (v ? v : null)),
  })
  .refine(
    // Gleiche Reihenfolge wie der CHECK der Tabelle: carbs + fat + protein.
    (v) => v.carbs + v.fat + v.protein <= 100,
    {
      path: ["protein"],
      error: (issue) => {
        const v = issue.input as { carbs: number; fat: number; protein: number };
        return `C + F + E zusammen höchstens 100 g (jetzt ${formatGrams(v.carbs + v.fat + v.protein)} g)`;
      },
      // Auch prüfen, wenn andere Felder fehlerhaft sind — Hauptsache, C/F/E sind Zahlen.
      when: (payload) => {
        const v = payload.value as Record<string, unknown> | null;
        return (
          typeof v === "object" &&
          v !== null &&
          [v.carbs, v.fat, v.protein].every((n) => typeof n === "number" && Number.isFinite(n))
        );
      },
    },
  );

/** Eingabe (vor dem Parsen) — Zahlen als Zahlen; `pieceGrams`/`barcode` optional bzw. `null`. */
export type FoodInput = z.input<typeof foodInputSchema>;
/** Geprüfte, normalisierte Eingabe. */
export type ParsedFoodInput = z.output<typeof foodInputSchema>;

// ---------------------------------------------------------------------------
// Hilfen

/**
 * „12,5“ / „12.5“ → 12.5. Leer oder unlesbar → `null`.
 * Erlaubt: optionales Minus (damit das Formular „Darf nicht negativ sein“ zeigen
 * kann), Ziffern, höchstens ein Dezimaltrenner. Keine Tausenderpunkte, kein Exponent.
 */
export function parseDecimal(text: string): number | null {
  const t = text.trim();
  if (!/^-?(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Such-/Sortierschlüssel: getrimmt, ohne Akzente/Umlaute (NFD + kombinierende
 * Zeichen entfernen), kleingeschrieben, ß → ss (damit „Strasse“ „Straße“ findet).
 */
export function normalizeFoodName(text: string): string {
  return text
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ß/g, "ss");
}

type FoodRow = {
  id: number;
  name: string;
  kcal: number;
  carbs: number;
  fat: number;
  protein: number;
  piece_grams: number | null;
  barcode: string | null;
};

const COLUMNS = "id, name, kcal, carbs, fat, protein, piece_grams, barcode";

function toFood(row: FoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    kcal: row.kcal,
    carbs: row.carbs,
    fat: row.fat,
    protein: row.protein,
    pieceGrams: row.piece_grams,
    barcode: row.barcode,
  };
}

function ok<T>(data: T): FoodResult<T> {
  return { data, error: null };
}

function fail<T = never>(error: FoodError): FoodResult<T> {
  return { data: null, error };
}

const notFound = (): FoodResult<never> => fail({ kind: "not_found", message: FOOD_MESSAGES.not_found });
const dbError = (message: string): FoodResult<never> => fail({ kind: "db", message });

function validationError(error: z.ZodError): FoodResult<never> {
  const fieldErrors: Partial<Record<FoodField, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as FoodField | undefined;
    if (field !== undefined && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message;
    }
  }
  return fail({ kind: "validation", message: FOOD_MESSAGES.validation, fieldErrors });
}

function isValidId(id: unknown): id is number {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0;
}

function isBarcodeUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed: foods\.barcode/.test(message);
}

async function barcodeOwner(
  exec: DbExecutor,
  barcode: string,
  exceptId: number | null,
): Promise<string | null> {
  const row = await exec.getFirst<{ name: string }>(
    "SELECT name FROM foods WHERE barcode = ? AND id IS NOT ? LIMIT 1",
    [barcode, exceptId],
  );
  return row?.name ?? null;
}

/** Nach dem Index-Fehler (Sicherung) den Besitzer für die Meldung nachlesen. */
async function barcodeTakenAfterConflict(barcode: string, exceptId: number | null): Promise<FoodResult<never>> {
  let owner: string | null = null;
  try {
    owner = await barcodeOwner(getDb(), barcode, exceptId);
  } catch {
    // Meldung dann ohne konkreten Namen.
  }
  return fail({
    kind: "barcode_taken",
    message: owner === null ? "Dieser Barcode gehört schon zu einem anderen Lebensmittel." : FOOD_MESSAGES.barcodeTaken(owner),
  });
}

// ---------------------------------------------------------------------------
// Änderungs-Meldungen

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
      // Ein fehlerhafter Listener darf weder andere noch das Ergebnis stören.
    }
  }
}

/** Meldet jede erfolgreiche Änderung (anlegen, ändern, löschen). Liefert die Abmelde-Funktion. */
export function subscribeFoods(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// Lesen

/**
 * Eigene Lebensmittel, sortiert nach `name_key`, höchstens 500. Mit Suchbegriff:
 * Teilstring im `name_key` (Suchbegriff gleich normalisiert; `instr` statt LIKE,
 * daher keine Sonderzeichen). Leerer Suchbegriff = alle.
 */
export async function listFoods(query?: string): Promise<FoodResult<Food[]>> {
  try {
    const key = typeof query === "string" ? normalizeFoodName(query) : "";
    const rows = await getDb().getAll<FoodRow>(
      `SELECT ${COLUMNS} FROM foods
       WHERE ? = '' OR instr(name_key, ?) > 0
       ORDER BY name_key, id
       LIMIT ?`,
      [key, key, FOODS_LIST_LIMIT],
    );
    return ok(rows.map(toFood));
  } catch {
    return dbError(FOOD_MESSAGES.load_failed);
  }
}

/** Ein Lebensmittel oder `not_found`. */
export async function getFood(id: number): Promise<FoodResult<Food>> {
  if (!isValidId(id)) return notFound();
  try {
    const row = await getDb().getFirst<FoodRow>(`SELECT ${COLUMNS} FROM foods WHERE id = ?`, [id]);
    return row ? ok(toFood(row)) : notFound();
  } catch {
    return dbError(FOOD_MESSAGES.load_failed);
  }
}

// ---------------------------------------------------------------------------
// Schreiben

type WriteOutcome = { food: Food } | { taken: string } | { missing: true };

/** Prüft per Zod und Barcode-Vergabe, speichert; liefert das neue `Food`. */
export async function createFood(input: FoodInput): Promise<FoodResult<Food>> {
  const parsed = foodInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const v = parsed.data;
  try {
    const now = Date.now();
    const outcome = await getDb().transaction<WriteOutcome>(async (tx) => {
      if (v.barcode !== null) {
        const owner = await barcodeOwner(tx, v.barcode, null);
        if (owner !== null) return { taken: owner };
      }
      const row = await tx.getFirst<FoodRow>(
        `INSERT INTO foods (name, name_key, kcal, carbs, fat, protein, piece_grams, barcode, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING ${COLUMNS}`,
        [v.name, normalizeFoodName(v.name), v.kcal, v.carbs, v.fat, v.protein, v.pieceGrams, v.barcode, now, now],
      );
      if (!row) throw new Error("INSERT lieferte keine Zeile");
      return { food: toFood(row) };
    });
    return finishWrite(outcome);
  } catch (error) {
    if (v.barcode !== null && isBarcodeUniqueViolation(error)) {
      return barcodeTakenAfterConflict(v.barcode, null);
    }
    return dbError(FOOD_MESSAGES.save_failed);
  }
}

/** Wie `createFood`; der eigene Barcode zählt nicht als vergeben. `not_found`, wenn gelöscht. */
export async function updateFood(id: number, input: FoodInput): Promise<FoodResult<Food>> {
  const parsed = foodInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  if (!isValidId(id)) return notFound();
  const v = parsed.data;
  try {
    const outcome = await getDb().transaction<WriteOutcome>(async (tx) => {
      const exists = await tx.getFirst<{ id: number }>("SELECT id FROM foods WHERE id = ?", [id]);
      if (!exists) return { missing: true };
      if (v.barcode !== null) {
        const owner = await barcodeOwner(tx, v.barcode, id);
        if (owner !== null) return { taken: owner };
      }
      const row = await tx.getFirst<FoodRow>(
        `UPDATE foods
         SET name = ?, name_key = ?, kcal = ?, carbs = ?, fat = ?, protein = ?,
             piece_grams = ?, barcode = ?, updated_at = ?
         WHERE id = ?
         RETURNING ${COLUMNS}`,
        [v.name, normalizeFoodName(v.name), v.kcal, v.carbs, v.fat, v.protein, v.pieceGrams, v.barcode, Date.now(), id],
      );
      return row ? { food: toFood(row) } : { missing: true };
    });
    return finishWrite(outcome);
  } catch (error) {
    if (v.barcode !== null && isBarcodeUniqueViolation(error)) {
      return barcodeTakenAfterConflict(v.barcode, id);
    }
    return dbError(FOOD_MESSAGES.save_failed);
  }
}

function finishWrite(outcome: WriteOutcome): FoodResult<Food> {
  if ("taken" in outcome) {
    return fail({ kind: "barcode_taken", message: FOOD_MESSAGES.barcodeTaken(outcome.taken) });
  }
  if ("missing" in outcome) return notFound();
  notify();
  return ok(outcome.food);
}

/** Löscht endgültig. Schon gelöscht (oder nie vorhanden) zählt als Erfolg. */
export async function deleteFood(id: number): Promise<FoodResult<{ id: number }>> {
  if (!isValidId(id)) return ok({ id });
  try {
    const { changes } = await getDb().run("DELETE FROM foods WHERE id = ?", [id]);
    if (changes > 0) notify();
    return ok({ id });
  } catch {
    return dbError(FOOD_MESSAGES.delete_failed);
  }
}
