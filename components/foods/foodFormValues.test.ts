/**
 * @jest-environment node
 */
import { runMigrations, setDbForTesting } from "@/lib/db";
import { migrations } from "@/lib/db/migrations";
import { createTestDb, type TestDb } from "@/lib/db/testing";
import { createFood, FOOD_MESSAGES, getFood, listFoods, type FoodInput } from "@/lib/foods";

import {
  canSaveFoodForm,
  deleteFoodFromForm,
  emptyFoodFormValues,
  foodFormResolver,
  foodToFormValues,
  initialFoodForm,
  loadFoodForm,
  saveFoodForm,
  toFoodInput,
  validateFoodForm,
  visibleFieldErrors,
  type FoodFormValues,
} from "./foodFormValues";

// expo-sqlite ist nativ — in Jest steckt hinter getDb() die In-Memory-DB.
jest.mock("@/lib/db/expo", () => ({ openExpoDatabase: jest.fn() }));

const base: FoodInput = { name: "Haferflocken", kcal: 372, carbs: 58.7, fat: 7, protein: 13.5 };

/** Gültig ausgefülltes Formular (Texte wie getippt). */
const filled: FoodFormValues = {
  name: "Magerquark",
  kcal: "67",
  carbs: "4",
  fat: "0,3",
  protein: "12",
  pieceGrams: "",
  barcode: null,
};

let db: TestDb;

beforeEach(async () => {
  db = createTestDb();
  const migrated = await runMigrations(db, migrations);
  expect(migrated.error).toBeNull();
  setDbForTesting(db);
});

afterEach(async () => {
  setDbForTesting(null);
  await db.close();
});

/** Lässt jedes Schreiben scheitern (simulierter Speicherfehler). */
function breakWrites(): void {
  const fail = async () => {
    throw new Error("disk I/O error");
  };
  setDbForTesting({ ...db, run: fail, transaction: fail });
}

async function names(): Promise<string[]> {
  const { data } = await listFoods();
  return (data ?? []).map((f) => f.name);
}

describe("Umwandlung Formular → FoodInput", () => {
  it("AC-6: „12,5“ wird zu 12.5, leeres Stückgewicht zu null", () => {
    const input = toFoodInput({ ...filled, carbs: "12,5", pieceGrams: "" });
    expect(input.carbs).toBe(12.5);
    expect(input.fat).toBe(0.3);
    expect(input.pieceGrams).toBeNull();
  });

  it("AC-3: leeres Pflichtfeld wird null, unlesbarer Text NaN (beides ungültig)", () => {
    const input = toFoodInput({ ...filled, kcal: "", carbs: "abc" });
    expect(input.kcal).toBeNull();
    expect(input.carbs).toBeNaN();
  });
});

describe("Prüfung und Sichern-Knopf", () => {
  it("AC-3: ein leeres Pflichtfeld deaktiviert „Sichern“", () => {
    for (const field of ["name", "kcal", "carbs", "fat", "protein"] as const) {
      const values = { ...filled, [field]: field === "name" ? "   " : "" };
      expect(canSaveFoodForm(validateFoodForm(values))).toBe(false);
    }
    expect(canSaveFoodForm(validateFoodForm(filled))).toBe(true);
  });

  it("AC-3: das leere Neu-Formular ist nicht sicherbar und zeigt noch keine Fehler", () => {
    const values = emptyFoodFormValues();
    expect(canSaveFoodForm(validateFoodForm(values))).toBe(false);
    expect(visibleFieldErrors(values, {})).toEqual({});
  });

  it("AC-4: C + F + E über 100 g → Fehler am Feld Eiweiß und „Sichern“ deaktiviert", () => {
    const values = { ...filled, carbs: "60", fat: "0", protein: "48" };
    const errors = visibleFieldErrors(values, {});
    expect(errors.protein).toBe("C + F + E zusammen höchstens 100 g (jetzt 108 g)");
    expect(canSaveFoodForm(validateFoodForm(values))).toBe(false);
  });

  it("AC-5: kcal über 900, negativer Wert und Stückgewicht 0 zeigen je einen Fehler am Feld", () => {
    const values = { ...filled, kcal: "950", fat: "-3", pieceGrams: "0" };
    const errors = visibleFieldErrors(values, {});
    expect(errors.kcal).toBe("Höchstens 900 kcal pro 100 g");
    expect(errors.fat).toBe("Darf nicht negativ sein");
    expect(errors.pieceGrams).toBe("Muss größer als 0 g sein");
    expect(canSaveFoodForm(validateFoodForm(values))).toBe(false);
  });

  it("AC-5: unlesbare Zahl zeigt „Bitte eine Zahl eingeben“", () => {
    expect(visibleFieldErrors({ ...filled, kcal: "1,2,3" }, {}).kcal).toBe("Bitte eine Zahl eingeben");
  });

  it("AC-3: geleertes Pflichtfeld zeigt den Fehler erst, wenn es geändert wurde", () => {
    const values = { ...filled, name: "", kcal: "" };
    expect(visibleFieldErrors(values, {})).toEqual({});
    const errors = visibleFieldErrors(values, { name: true, kcal: true });
    expect(errors.name).toBe("Bitte einen Namen eingeben");
    expect(errors.kcal).toBe("Pflichtfeld");
  });

  it("AC-6: validateFoodForm liefert die geprüfte Eingabe mit 12.5", () => {
    const { input, errors } = validateFoodForm({ ...filled, protein: "12,5" });
    expect(errors).toEqual({});
    expect(input?.protein).toBe(12.5);
  });

  it("AC-4: der Resolver meldet Feldfehler im react-hook-form-Format", async () => {
    const values = { ...filled, carbs: "60", protein: "48" };
    const result = await foodFormResolver(values, undefined, {
      fields: {},
      shouldUseNativeValidation: false,
    });
    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({ protein: { type: "validation", message: expect.stringContaining("100 g") } });
  });

  it("AC-6: der Resolver liefert bei gültigen Werten die Formularwerte unverändert", async () => {
    const result = await foodFormResolver(filled, undefined, { fields: {}, shouldUseNativeValidation: false });
    expect(result.errors).toEqual({});
    expect(result.values).toEqual(filled);
  });
});

describe("Startwerte", () => {
  it("AC-11: Parameter `name` füllt den Namen vor (Neu)", () => {
    expect(initialFoodForm({ name: "Hüttenkäse" })).toEqual({
      mode: "create",
      values: { ...emptyFoodFormValues(), name: "Hüttenkäse" },
    });
  });

  it("AC-11: ohne Parameter leeres Neu-Formular", () => {
    expect(initialFoodForm({})).toEqual({ mode: "create", values: emptyFoodFormValues() });
  });

  it("AC-12: Parameter `id` öffnet Bearbeiten", () => {
    expect(initialFoodForm({ id: "7", name: "egal" })).toEqual({ mode: "edit", id: 7 });
  });

  it("AC-12: ungültige `id` zählt als nicht vorhanden", async () => {
    expect(initialFoodForm({ id: "abc" })).toEqual({ mode: "edit", id: NaN });
    const loaded = await loadFoodForm(NaN);
    expect(loaded).toEqual({ status: "not_found", message: FOOD_MESSAGES.not_found });
  });

  it("AC-12: Bearbeiten lädt die Werte mit Dezimalkomma", async () => {
    const { data } = await createFood({ ...base, pieceGrams: 40, barcode: "4006040123456" });
    const loaded = await loadFoodForm(data!.id);
    expect(loaded).toEqual({
      status: "ready",
      values: {
        name: "Haferflocken",
        kcal: "372",
        carbs: "58,7",
        fat: "7",
        protein: "13,5",
        pieceGrams: "40",
        barcode: "4006040123456",
      },
    });
    expect(foodToFormValues(data!).pieceGrams).toBe("40");
  });
});

describe("Sichern", () => {
  it("AC-2: Neu sichern legt das Lebensmittel an und meldet „gesichert“", async () => {
    const outcome = await saveFoodForm(null, filled);
    expect(outcome).toEqual({ status: "saved" });
    expect(await names()).toEqual(["Magerquark"]);
  });

  it("AC-6: „12,5“ ist nach dem Sichern als 12.5 gespeichert", async () => {
    await saveFoodForm(null, { ...filled, carbs: "12,5" });
    const { data } = await listFoods();
    expect(data![0].carbs).toBe(12.5);
  });

  it("AC-19: zweites Lebensmittel mit gleichem Namen — beide in der Liste", async () => {
    expect(await saveFoodForm(null, filled)).toEqual({ status: "saved" });
    expect(await saveFoodForm(null, { ...filled, kcal: "70" })).toEqual({ status: "saved" });
    expect(await names()).toEqual(["Magerquark", "Magerquark"]);
  });

  it("AC-12: Bearbeiten sichern ändert die Werte", async () => {
    const { data } = await createFood(base);
    const outcome = await saveFoodForm(data!.id, { ...foodToFormValues(data!), kcal: "380", fat: "7,5" });
    expect(outcome).toEqual({ status: "saved" });
    const { data: after } = await getFood(data!.id);
    expect(after).toMatchObject({ kcal: 380, fat: 7.5 });
  });

  it("AC-17: entfernter Barcode wird als null gespeichert", async () => {
    const { data } = await createFood({ ...base, barcode: "4006040123456" });
    const outcome = await saveFoodForm(data!.id, { ...foodToFormValues(data!), barcode: null });
    expect(outcome).toEqual({ status: "saved" });
    const { data: after } = await getFood(data!.id);
    expect(after!.barcode).toBeNull();
  });

  it("AC-20: Speicherfehler → Hinweis oben, nichts geschlossen", async () => {
    breakWrites();
    const outcome = await saveFoodForm(null, filled);
    expect(outcome).toEqual({ status: "banner", message: FOOD_MESSAGES.save_failed });
  });

  it("AC-20: vergebener Barcode → Hinweis mit dem Text der Datenschicht", async () => {
    await createFood({ ...base, name: "Hafer A", barcode: "4006040123456" });
    const { data } = await createFood({ ...base, name: "Hafer B" });
    const outcome = await saveFoodForm(data!.id, { ...foodToFormValues(data!), barcode: "4006040123456" });
    expect(outcome).toEqual({ status: "banner", message: FOOD_MESSAGES.barcodeTaken("Hafer A") });
  });

  it("AC-20: Validierungsfehler der Datenschicht → Fehler am Feld", async () => {
    const outcome = await saveFoodForm(null, { ...filled, kcal: "950" });
    expect(outcome).toEqual({ status: "fields", fieldErrors: { kcal: "Höchstens 900 kcal pro 100 g" } });
  });

  it("AC-12: inzwischen gelöschtes Lebensmittel → „nicht mehr vorhanden“", async () => {
    const outcome = await saveFoodForm(9999, filled);
    expect(outcome).toEqual({ status: "not_found", message: FOOD_MESSAGES.not_found });
  });
});

describe("Löschen im Bearbeiten-Sheet", () => {
  it("AC-16: löscht das Lebensmittel endgültig", async () => {
    const { data } = await createFood(base);
    expect(await deleteFoodFromForm(data!.id)).toEqual({ status: "deleted" });
    expect(await names()).toEqual([]);
  });

  it("AC-16: Löschfehler → Hinweis oben", async () => {
    const { data } = await createFood(base);
    breakWrites();
    expect(await deleteFoodFromForm(data!.id)).toEqual({ status: "banner", message: FOOD_MESSAGES.delete_failed });
  });
});
