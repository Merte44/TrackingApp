/**
 * @jest-environment node
 *
 * Security-Tests PROJ-2 (Vertrauensgrenze: Nutzereingabe → SQLite, Route-Parameter → Datenschicht).
 * Regressionsschutz: jede Abwehr hier muss bestehen bleiben.
 */
import { runMigrations, setDbForTesting } from "./db";
import { migrations } from "./db/migrations";
import { createTestDb, type TestDb } from "./db/testing";
import { createFood, deleteFood, getFood, listFoods, updateFood, type FoodInput } from "./foods";

jest.mock("./db/expo", () => ({ openExpoDatabase: jest.fn() }));

const base: FoodInput = { name: "Haferflocken", kcal: 372, carbs: 58.7, fat: 7, protein: 13.5 };

let db: TestDb;

beforeEach(async () => {
  db = createTestDb();
  expect((await runMigrations(db, migrations)).error).toBeNull();
  setDbForTesting(db);
});

afterEach(async () => {
  setDbForTesting(null);
  await db.close();
});

async function count(): Promise<number> {
  return (await db.getFirst<{ n: number }>("SELECT count(*) AS n FROM foods"))!.n;
}

describe("SQL-Injection", () => {
  const payloads = [
    "'); DROP TABLE foods;--",
    "x' OR '1'='1",
    "\"; DELETE FROM foods; --",
    "Robert'); UPDATE foods SET kcal = 0;--",
  ];

  it.each(payloads)("Name %p wird wörtlich gespeichert, Tabelle bleibt intakt", async (name) => {
    const other = await createFood({ ...base, name: "Opfer" });
    const { data, error } = await createFood({ ...base, name });
    expect(error).toBeNull();
    expect(data!.name).toBe(name);
    expect(await count()).toBe(2);
    expect((await getFood(other.data!.id)).data!.kcal).toBe(372);
  });

  it.each(payloads)("Suchbegriff %p liefert nur echte Treffer", async (query) => {
    await createFood({ ...base, name: "Opfer" });
    const { data, error } = await listFoods(query);
    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect(await count()).toBe(1);
  });

  it("LIKE-/GLOB-Platzhalter im Suchbegriff wirken nicht als Wildcard", async () => {
    await createFood({ ...base, name: "Apfel" });
    for (const q of ["%", "_", "*", "?", "[a]"]) {
      expect((await listFoods(q)).data).toEqual([]);
    }
  });
});

describe("Massenzuweisung / fremde Felder", () => {
  it("id, name_key, created_at im Input werden ignoriert — kein Überschreiben fremder Zeilen", async () => {
    const victim = await createFood({ ...base, name: "Opfer" });
    const evil = { ...base, name: "Angreifer", id: victim.data!.id, name_key: "aaa", created_at: 0 } as FoodInput;
    const { data, error } = await createFood(evil);
    expect(error).toBeNull();
    expect(data!.id).not.toBe(victim.data!.id);
    expect((await getFood(victim.data!.id)).data!.name).toBe("Opfer");
    const row = await db.getFirst<{ name_key: string; created_at: number }>(
      "SELECT name_key, created_at FROM foods WHERE id = ?",
      [data!.id],
    );
    expect(row!.name_key).toBe("angreifer");
    expect(row!.created_at).toBeGreaterThan(0);
  });

  it("__proto__ im Input verschmutzt keine Prototypen", async () => {
    const evil = JSON.parse(`{"name":"P","kcal":1,"carbs":1,"fat":1,"protein":1,"__proto__":{"polluted":true}}`);
    const { error } = await createFood(evil);
    expect(error).toBeNull();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("Böse Zahlen und Typen werden abgelehnt, DB unverändert", () => {
  const bad: [string, Partial<Record<keyof FoodInput, unknown>>][] = [
    ["NaN", { kcal: Number.NaN }],
    ["Infinity", { kcal: Number.POSITIVE_INFINITY }],
    ["-Infinity", { carbs: Number.NEGATIVE_INFINITY }],
    ["negativ", { fat: -1 }],
    ["riesig", { kcal: 1e308 }],
    ["Zahl als String", { kcal: "100" }],
    ["Objekt", { protein: { valueOf: () => 1 } }],
    ["BigInt", { kcal: BigInt(1) }],
    ["Summe > 100", { carbs: 60, fat: 30, protein: 20 }],
    ["Stückgewicht 0", { pieceGrams: 0 }],
    ["Stückgewicht NaN", { pieceGrams: Number.NaN }],
    ["Name nur Whitespace", { name: " \t\n 　 " }],
    ["Name als Zahl", { name: 42 }],
    ["Name als Array", { name: ["a"] }],
    ["Barcode mit Zeilenumbruch", { barcode: "12345678\n" }],
    ["Barcode mit SQL", { barcode: "1234567' OR 1=1--" }],
    ["Barcode arabisch-indische Ziffern", { barcode: "١٢٣٤٥٦٧٨" }],
    ["Barcode Vollbreiten-Ziffern", { barcode: "１２３４５６７８" }],
    ["Barcode 15 Ziffern", { barcode: "123456789012345" }],
    ["Barcode als Zahl", { barcode: 12345678 }],
  ];

  it.each(bad)("%s → validation, nichts gespeichert", async (_label, patch) => {
    const { data, error } = await createFood({ ...base, ...patch } as FoodInput);
    expect(data).toBeNull();
    expect(error!.kind).toBe("validation");
    expect(await count()).toBe(0);
  });

  it.each([null, undefined, 42, "x", [], () => 1])("Input %p statt Objekt → validation, kein Wurf", async (input) => {
    await expect(createFood(input as unknown as FoodInput)).resolves.toMatchObject({
      data: null,
      error: { kind: "validation" },
    });
    expect(await count()).toBe(0);
  });

  it("updateFood mit bösem Input ändert die bestehende Zeile nicht", async () => {
    const { data } = await createFood(base);
    const { error } = await updateFood(data!.id, { ...base, kcal: Number.NaN });
    expect(error!.kind).toBe("validation");
    expect((await getFood(data!.id)).data!.kcal).toBe(372);
  });
});

describe("Manipulierte ids (Route-Parameter)", () => {
  const badIds: unknown[] = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53, "1", "1 OR 1=1", null, {}];

  it.each(badIds)("getFood(%p) → not_found", async (id) => {
    await createFood(base);
    expect((await getFood(id as number)).error!.kind).toBe("not_found");
  });

  it.each(badIds)("updateFood(%p) → kein Schreiben", async (id) => {
    await createFood(base);
    const { error } = await updateFood(id as number, { ...base, name: "Übernommen" });
    expect(error!.kind).toBe("not_found");
    expect((await listFoods()).data!.map((f) => f.name)).toEqual(["Haferflocken"]);
  });

  it.each(badIds)("deleteFood(%p) löscht nichts", async (id) => {
    await createFood(base);
    expect((await deleteFood(id as number)).error).toBeNull();
    expect(await count()).toBe(1);
  });
});

describe("Speicher fluten / Unicode-Sonderfälle", () => {
  it("1-MB-Name: kein Absturz, Liste bleibt lesbar", async () => {
    const huge = "A".repeat(1024 * 1024);
    const { error } = await createFood({ ...base, name: huge });
    expect(error).toBeNull();
    const list = await listFoods("a");
    expect(list.error).toBeNull();
    expect(list.data).toHaveLength(1);
  });

  it("1-MB-Suchbegriff: kein Absturz", async () => {
    await createFood(base);
    const { data, error } = await listFoods("x".repeat(1024 * 1024));
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it.each([
    ["einsames Surrogat", "\uD800Brot"],
    ["NUL-Zeichen", "Brot\u0000Butter"],
    ["RTL-Override", "‮otorb"],
    ["Zalgo", "B̶̵̴r̷̸ot"],
    ["Emoji-ZWJ", "\u{1F468}‍\u{1F469}‍\u{1F467}"],
  ])("Name mit %s: kein Absturz, Ergebnis statt Wurf", async (_label, name) => {
    const result = await createFood({ ...base, name });
    expect(result.error === null || result.error.kind === "db").toBe(true);
    const list = await listFoods(name);
    expect(list.error).toBeNull();
  });
});
