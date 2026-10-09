/**
 * @jest-environment node
 */
import { runMigrations, setDbForTesting } from "./db";
import { migrations } from "./db/migrations";
import { createTestDb, type TestDb } from "./db/testing";
import {
  createFood,
  deleteFood,
  foodInputSchema,
  formatDecimal,
  getFood,
  listFoods,
  normalizeFoodName,
  parseDecimal,
  subscribeFoods,
  updateFood,
  type FoodInput,
} from "./foods";

// expo-sqlite ist nativ — in Jest steckt hinter getDb() die In-Memory-DB.
jest.mock("./db/expo", () => ({ openExpoDatabase: jest.fn() }));

const base: FoodInput = { name: "Haferflocken", kcal: 372, carbs: 58.7, fat: 7, protein: 13.5 };

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

async function names(query?: string): Promise<string[]> {
  const { data, error } = await listFoods(query);
  expect(error).toBeNull();
  return data!.map((f) => f.name);
}

/** Lässt jede DB-Operation scheitern (simulierter Speicher-/Lesefehler). */
function breakDb(): void {
  const fail = async () => {
    throw new Error("disk I/O error");
  };
  setDbForTesting({
    ...db,
    run: fail,
    exec: fail,
    getFirst: fail,
    getAll: fail,
    transaction: fail,
  });
}

describe("PROJ-2 lib/foods", () => {
  describe("parseDecimal", () => {
    it("AC-6: „12,5“ und „12.5“ werden zu 12.5", () => {
      expect(parseDecimal("12,5")).toBe(12.5);
      expect(parseDecimal("12.5")).toBe(12.5);
      expect(parseDecimal(" 7 ")).toBe(7);
      expect(parseDecimal("0,25")).toBe(0.25);
      expect(parseDecimal(",5")).toBe(0.5);
      expect(parseDecimal("-3")).toBe(-3);
    });

    it("AC-6: leer oder unlesbar ist ungültig (null)", () => {
      for (const text of ["", "   ", "abc", "12,5,1", "1.000,5", "12 5", "1e3", "--1", ",", "Infinity"]) {
        expect(parseDecimal(text)).toBeNull();
      }
    });

    it("AC-6: Komma-Eingabe landet als 12.5 in der Datenbank", async () => {
      const carbs = parseDecimal("12,5")!;
      const { data, error } = await createFood({ ...base, carbs });
      expect(error).toBeNull();
      const row = await db.getFirst<{ carbs: number }>("SELECT carbs FROM foods WHERE id = ?", [
        data!.id,
      ]);
      expect(row!.carbs).toBe(12.5);
    });
  });

  describe("formatDecimal (BUG-5)", () => {
    it("BUG-5: kleine und große Werte ohne Exponent, mit Dezimalkomma und ohne abschließende Nullen", () => {
      expect(formatDecimal(0.0000001)).toBe("0,0000001");
      expect(formatDecimal(0.00000015)).toBe("0,00000015");
      expect(formatDecimal(-0.0000001)).toBe("-0,0000001");
      expect(formatDecimal(12.5)).toBe("12,5");
      expect(formatDecimal(100)).toBe("100");
      expect(formatDecimal(0)).toBe("0");
      expect(formatDecimal(1e21)).toBe("1000000000000000000000");
    });

    it("BUG-5: Rechenrauschen aus Summen wird nicht angezeigt", () => {
      expect(formatDecimal(100.10000000000001)).toBe("100,1");
    });

    it("BUG-5: parseDecimal liest das Ergebnis wieder als denselben Wert", () => {
      for (const value of [0.0000001, 1.5e-7, 12.5, 100, 0.25, 58.7, 899.999, 1e-12]) {
        expect(parseDecimal(formatDecimal(value))).toBe(value);
      }
    });
  });

  describe("foodInputSchema", () => {
    function fieldErrors(input: unknown): Record<string, string> {
      const parsed = foodInputSchema.safeParse(input);
      expect(parsed.success).toBe(false);
      const out: Record<string, string> = {};
      for (const issue of parsed.error!.issues) {
        out[String(issue.path[0])] ??= issue.message;
      }
      return out;
    }

    it("akzeptiert gültige Werte und Grenzwerte", () => {
      for (const input of [
        base,
        { ...base, kcal: 0, carbs: 0, fat: 0, protein: 0 },
        { ...base, kcal: 900, carbs: 100, fat: 0, protein: 0 },
        { ...base, carbs: 33.3, fat: 33.3, protein: 33.4 },
        { ...base, pieceGrams: 0.5, barcode: "12345678" },
        { ...base, barcode: "12345678901234" },
      ]) {
        expect(foodInputSchema.safeParse(input).success).toBe(true);
      }
    });

    it("trimmt den Namen, leere optionale Felder werden null", () => {
      const parsed = foodInputSchema.parse({ ...base, name: "  Quark  ", pieceGrams: undefined, barcode: "" });
      expect(parsed).toEqual({ ...base, name: "Quark", pieceGrams: null, barcode: null });
    });

    it("AC-7: Fehlertexte je Feld (deutsch) für Grenzverletzungen", () => {
      expect(
        fieldErrors({ name: "   ", kcal: 950, carbs: 101, fat: -3, protein: Number.NaN, pieceGrams: 0, barcode: "12ab5678" }),
      ).toEqual({
        name: "Bitte einen Namen eingeben",
        kcal: "Höchstens 900 kcal pro 100 g",
        carbs: "Höchstens 100 g",
        fat: "Darf nicht negativ sein",
        protein: "Bitte eine Zahl eingeben",
        pieceGrams: "Muss größer als 0 g sein",
        barcode: "Barcode muss aus 8–14 Ziffern bestehen",
      });
    });

    it("AC-7: fehlende Pflichtfelder melden „Pflichtfeld“", () => {
      expect(fieldErrors({})).toEqual({
        name: "Bitte einen Namen eingeben",
        kcal: "Pflichtfeld",
        carbs: "Pflichtfeld",
        fat: "Pflichtfeld",
        protein: "Pflichtfeld",
      });
      expect(fieldErrors({ ...base, kcal: null }).kcal).toBe("Pflichtfeld");
    });

    it("AC-7: Summe C + F + E über 100 g → Fehler am Feld protein, auch wenn andere Felder fehlerhaft sind", () => {
      expect(fieldErrors({ ...base, carbs: 60, fat: 1, protein: 48 })).toEqual({
        protein: "C + F + E zusammen höchstens 100 g (jetzt 109 g)",
      });
      expect(fieldErrors({ ...base, name: "", carbs: 60, fat: 0.5, protein: 40 })).toEqual({
        name: "Bitte einen Namen eingeben",
        protein: "C + F + E zusammen höchstens 100 g (jetzt 100,5 g)",
      });
    });

    it("AC-4: Summe genau 100 g trotz Gleitkomma-Rest (0,2 + 83,9 + 15,9) ist gültig und speicherbar", async () => {
      const input = { ...base, carbs: 0.2, fat: 83.9, protein: 15.9 };
      expect(0.2 + 83.9 + 15.9).toBeGreaterThan(100); // Gleitkomma-Rest
      expect(foodInputSchema.safeParse(input).success).toBe(true);
      const { error } = await createFood(input);
      expect(error).toBeNull();
    });

    it("AC-4: Summenfehler nennt die Summe so genau, dass sie über 100 g liegt", () => {
      expect(fieldErrors({ ...base, carbs: 33.34, fat: 33.33, protein: 33.37 }).protein).toBe(
        "C + F + E zusammen höchstens 100 g (jetzt 100,04 g)",
      );
    });

    it("AC-7: Barcode-Grenzen 8–14 Ziffern", () => {
      expect(fieldErrors({ ...base, barcode: "1234567" }).barcode).toBeDefined();
      expect(fieldErrors({ ...base, barcode: "123456789012345" }).barcode).toBeDefined();
    });
  });

  describe("normalizeFoodName", () => {
    it("AC-9: klein, ohne Umlaute/Akzente, ß → ss", () => {
      expect(normalizeFoodName("Äpfel")).toBe("apfel");
      expect(normalizeFoodName("  Crème Brûlée ")).toBe("creme brulee");
      expect(normalizeFoodName("STRAẞE Straße")).toBe("strasse strasse");
      expect(normalizeFoodName("Konﬁtüre")).toBe("konfiture");
    });
  });

  describe("createFood / getFood", () => {
    it("Happy Path: legt an, liefert Food, setzt name_key und Zeitstempel", async () => {
      const before = Date.now();
      const { data, error } = await createFood({ ...base, name: " Äpfel ", pieceGrams: 180, barcode: "4000000000001" });
      expect(error).toBeNull();
      expect(data).toEqual({
        id: expect.any(Number),
        name: "Äpfel",
        kcal: 372,
        carbs: 58.7,
        fat: 7,
        protein: 13.5,
        pieceGrams: 180,
        barcode: "4000000000001",
      });
      const row = await db.getFirst<{ name_key: string; created_at: number; updated_at: number }>(
        "SELECT name_key, created_at, updated_at FROM foods WHERE id = ?",
        [data!.id],
      );
      expect(row!.name_key).toBe("apfel");
      expect(row!.created_at).toBeGreaterThanOrEqual(before);
      expect(row!.updated_at).toBe(row!.created_at);
      expect(await getFood(data!.id)).toEqual({ data, error: null });
    });

    it("getFood: unbekannte id → not_found", async () => {
      const { data, error } = await getFood(999);
      expect(data).toBeNull();
      expect(error).toEqual({ kind: "not_found", message: "Lebensmittel nicht mehr vorhanden" });
      expect((await getFood(-1)).error?.kind).toBe("not_found");
    });

    it("AC-7: ungültige Werte unter Umgehung des Formulars → validation, nichts geschrieben", async () => {
      for (const bad of [
        { ...base, kcal: 901 },
        { ...base, carbs: -0.1 },
        { ...base, carbs: 50, fat: 30, protein: 20.5 },
        { ...base, pieceGrams: 0 },
        { ...base, name: "  " },
        { ...base, barcode: "abc" },
        { ...base, kcal: "372" },
        { ...base, kcal: Number.POSITIVE_INFINITY },
      ]) {
        const { data, error } = await createFood(bad as FoodInput);
        expect(data).toBeNull();
        expect(error?.kind).toBe("validation");
        expect(error?.message).toBe("Bitte die markierten Felder prüfen.");
        expect(Object.keys(error?.fieldErrors ?? {}).length).toBeGreaterThan(0);
      }
      expect(await names()).toEqual([]);
    });

    it("AC-7: updateFood mit ungültigen Werten → validation, Datensatz unverändert", async () => {
      const created = (await createFood(base)).data!;
      const { error } = await updateFood(created.id, { ...base, kcal: -1 });
      expect(error).toMatchObject({ kind: "validation", fieldErrors: { kcal: "Darf nicht negativ sein" } });
      expect((await getFood(created.id)).data).toEqual(created);
    });

    it("AC-19: zwei Lebensmittel mit gleichem Namen stehen beide in der Liste", async () => {
      const a = await createFood({ ...base, name: "Joghurt" });
      const b = await createFood({ ...base, name: "Joghurt", kcal: 60 });
      expect(a.error).toBeNull();
      expect(b.error).toBeNull();
      expect(a.data!.id).not.toBe(b.data!.id);
      expect(await names()).toEqual(["Joghurt", "Joghurt"]);
    });
  });

  describe("listFoods", () => {
    async function seed(...list: string[]): Promise<void> {
      for (const name of list) {
        expect((await createFood({ ...base, name })).error).toBeNull();
      }
    }

    it("AC-8: alphabetisch ohne Beachtung der Groß-/Kleinschreibung (und Umlaute)", async () => {
      await seed("banane", "Zwiebel", "Äpfel", "apfelmus", "Birne", "aprikose");
      expect(await names()).toEqual(["Äpfel", "apfelmus", "aprikose", "banane", "Birne", "Zwiebel"]);
    });

    it("AC-8: höchstens 500 Einträge", async () => {
      await db.transaction(async (tx) => {
        for (let i = 0; i < 510; i++) {
          await tx.run(
            "INSERT INTO foods (name, name_key, kcal, carbs, fat, protein) VALUES (?, ?, 1, 1, 1, 1)",
            [`F${i}`, `f${String(i).padStart(3, "0")}`],
          );
        }
      });
      const { data } = await listFoods();
      expect(data).toHaveLength(500);
    });

    it("AC-9: „apf“ findet „Äpfel“ — Teilstring, unabhängig von Groß-/Kleinschreibung und Umlauten", async () => {
      await seed("Äpfel", "Bratapfel", "Birne", "Straße");
      expect(await names("apf")).toEqual(["Äpfel", "Bratapfel"]);
      expect(await names("ÄPF")).toEqual(["Äpfel", "Bratapfel"]);
      expect(await names("  Äpf ")).toEqual(["Äpfel", "Bratapfel"]);
      expect(await names("strasse")).toEqual(["Straße"]);
      expect(await names("xyz")).toEqual([]);
      expect(await names("")).toEqual(["Äpfel", "Birne", "Bratapfel", "Straße"]);
    });

    it("AC-9: LIKE-Sonderzeichen im Suchbegriff sind gewöhnliche Zeichen", async () => {
      await seed("Milch 1,5%", "Milch 3,5", "a_b", "axb");
      expect(await names("%")).toEqual(["Milch 1,5%"]);
      expect(await names("_")).toEqual(["a_b"]);
    });
  });

  describe("updateFood", () => {
    it("ändert Werte, setzt name_key und updated_at neu", async () => {
      const created = (await createFood({ ...base, name: "Apfel" })).data!;
      await db.run("UPDATE foods SET updated_at = 1 WHERE id = ?", [created.id]);
      const { data, error } = await updateFood(created.id, { ...base, name: "Öl", kcal: 884, carbs: 0, fat: 100, protein: 0 });
      expect(error).toBeNull();
      expect(data).toMatchObject({ id: created.id, name: "Öl", kcal: 884, fat: 100 });
      const row = await db.getFirst<{ name_key: string; updated_at: number; created_at: number }>(
        "SELECT name_key, updated_at, created_at FROM foods WHERE id = ?",
        [created.id],
      );
      expect(row!.name_key).toBe("ol");
      expect(row!.updated_at).toBeGreaterThan(1);
    });

    it("AC-17: Barcode entfernen (null oder leer) → kein Barcode mehr", async () => {
      const created = (await createFood({ ...base, barcode: "4000000000001" })).data!;
      const removed = await updateFood(created.id, { ...base, barcode: null });
      expect(removed.error).toBeNull();
      expect(removed.data!.barcode).toBeNull();
      const row = await db.getFirst<{ barcode: string | null }>("SELECT barcode FROM foods WHERE id = ?", [created.id]);
      expect(row!.barcode).toBeNull();

      const again = (await updateFood(created.id, { ...base, barcode: "4000000000001" })).data!;
      expect(again.barcode).toBe("4000000000001");
      expect((await updateFood(created.id, { ...base, barcode: "" })).data!.barcode).toBeNull();
      // Ohne Barcode-Feld (Formular ohne Barcode) ebenso kein Barcode.
      await updateFood(created.id, { ...base, barcode: "4000000000001" });
      expect((await updateFood(created.id, base)).data!.barcode).toBeNull();
    });

    it("gelöschtes Lebensmittel → not_found", async () => {
      const created = (await createFood(base)).data!;
      await deleteFood(created.id);
      const { data, error } = await updateFood(created.id, base);
      expect(data).toBeNull();
      expect(error?.kind).toBe("not_found");
      expect(await names()).toEqual([]);
    });
  });

  describe("Barcode-Eindeutigkeit", () => {
    it("AC-18: createFood mit vergebenem Barcode → barcode_taken mit Namen, nichts geschrieben", async () => {
      await createFood({ ...base, name: "Skyr", barcode: "4000000000001" });
      const { data, error } = await createFood({ ...base, name: "Quark", barcode: "4000000000001" });
      expect(data).toBeNull();
      expect(error).toEqual({ kind: "barcode_taken", message: "Dieser Barcode gehört schon zu „Skyr“." });
      expect(await names()).toEqual(["Skyr"]);
    });

    it("AC-18: updateFood mit Barcode eines anderen → barcode_taken; eigener Barcode zählt nicht", async () => {
      await createFood({ ...base, name: "Skyr", barcode: "4000000000001" });
      const quark = (await createFood({ ...base, name: "Quark", barcode: "4000000000002" })).data!;

      const taken = await updateFood(quark.id, { ...base, name: "Quark", barcode: "4000000000001" });
      expect(taken.error).toEqual({ kind: "barcode_taken", message: "Dieser Barcode gehört schon zu „Skyr“." });
      expect((await getFood(quark.id)).data!.barcode).toBe("4000000000002");

      const own = await updateFood(quark.id, { ...base, name: "Magerquark", barcode: "4000000000002" });
      expect(own.error).toBeNull();
      expect(own.data!.name).toBe("Magerquark");
    });

    it("AC-18: eindeutiger Index als Sicherung → barcode_taken, falls die Vorabprüfung nichts sieht", async () => {
      await createFood({ ...base, name: "Skyr", barcode: "4000000000001" });
      // Vorabprüfung „übersieht“ den Barcode (Rennen), der Index greift.
      const realTx = db.transaction.bind(db);
      setDbForTesting({
        ...db,
        transaction: (task) =>
          realTx((tx) =>
            task({
              ...tx,
              getFirst: async <T,>(sql: string, params?: readonly unknown[]) =>
                /barcode = \?/.test(sql) ? null : tx.getFirst<T>(sql, params as never),
            }),
          ),
      });
      const { error } = await createFood({ ...base, name: "Quark", barcode: "4000000000001" });
      expect(error).toEqual({ kind: "barcode_taken", message: "Dieser Barcode gehört schon zu „Skyr“." });
      setDbForTesting(db);
      expect(await names()).toEqual(["Skyr"]);
    });
  });

  describe("deleteFood", () => {
    it("löscht endgültig; schon gelöscht zählt als Erfolg", async () => {
      const created = (await createFood(base)).data!;
      expect(await deleteFood(created.id)).toEqual({ data: { id: created.id }, error: null });
      expect((await getFood(created.id)).error?.kind).toBe("not_found");
      expect(await deleteFood(created.id)).toEqual({ data: { id: created.id }, error: null });
    });
  });

  describe("subscribeFoods", () => {
    it("meldet nur erfolgreiche Änderungen; Abmelden beendet Meldungen", async () => {
      const listener = jest.fn();
      const unsubscribe = subscribeFoods(listener);

      const created = (await createFood(base)).data!;
      expect(listener).toHaveBeenCalledTimes(1);
      await updateFood(created.id, { ...base, kcal: 100 });
      expect(listener).toHaveBeenCalledTimes(2);

      await createFood({ ...base, kcal: 1000 }); // validation
      await updateFood(9999, base); // not_found
      expect(listener).toHaveBeenCalledTimes(2);

      await deleteFood(created.id);
      expect(listener).toHaveBeenCalledTimes(3);
      await deleteFood(created.id); // schon gelöscht — keine Änderung
      expect(listener).toHaveBeenCalledTimes(3);

      unsubscribe();
      await createFood(base);
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it("ein werfender Listener stört weder andere Listener noch das Ergebnis", async () => {
      const bad = jest.fn(() => {
        throw new Error("boom");
      });
      const good = jest.fn();
      const offBad = subscribeFoods(bad);
      const offGood = subscribeFoods(good);
      const { error } = await createFood(base);
      expect(error).toBeNull();
      expect(good).toHaveBeenCalledTimes(1);
      offBad();
      offGood();
    });
  });

  describe("Datenbankfehler", () => {
    const SAVE = "Speichern fehlgeschlagen. Bitte erneut versuchen.";

    it("AC-20: Speichern schlägt fehl → db-Fehler mit Nutzertext, keine Ausnahme, keine Meldung", async () => {
      const created = (await createFood(base)).data!;
      const listener = jest.fn();
      const off = subscribeFoods(listener);
      breakDb();
      expect(await createFood(base)).toEqual({ data: null, error: { kind: "db", message: SAVE } });
      expect(await updateFood(created.id, base)).toEqual({ data: null, error: { kind: "db", message: SAVE } });
      expect(await deleteFood(created.id)).toEqual({
        data: null,
        error: { kind: "db", message: "Löschen fehlgeschlagen. Bitte erneut versuchen." },
      });
      expect(listener).not.toHaveBeenCalled();
      off();
    });

    it("CHECK der Tabelle bleibt zweite Sicherung hinter Zod (T1-Schema)", async () => {
      // Direkt auf SQL-Ebene: ein Wert, den Zod nie durchließe, scheitert am CHECK.
      await expect(
        db.run("INSERT INTO foods (name, name_key, kcal, carbs, fat, protein) VALUES ('x','x',901,0,0,0)"),
      ).rejects.toThrow(/CHECK constraint failed/);
    });

    it("Lesen schlägt fehl → db-Fehler statt Ausnahme", async () => {
      breakDb();
      const list = await listFoods();
      expect(list.data).toBeNull();
      expect(list.error).toEqual({ kind: "db", message: "Lebensmittel konnten nicht geladen werden." });
      expect((await getFood(1)).error?.kind).toBe("db");
    });

    it("DB nicht initialisiert → db-Fehler statt Ausnahme", async () => {
      setDbForTesting(null);
      expect((await listFoods()).error?.kind).toBe("db");
      expect((await createFood(base)).error?.kind).toBe("db");
    });
  });
});
