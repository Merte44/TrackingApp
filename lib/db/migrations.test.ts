/**
 * @jest-environment node
 */
import { runMigrations, validateMigrations } from "./migrate";
import { migrations as appMigrations } from "./migrations";
import { createTestDb, type TestDb } from "./testing";
import type { Migration } from "./types";

// Eigene Test-Listen für runMigrations; die echte App-Liste wird unten separat geprüft.
const m1: Migration = {
  version: 1,
  name: "0001_test-1_parents",
  up: async (tx) => {
    await tx.exec(`
      CREATE TABLE parent (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE child (
        id INTEGER PRIMARY KEY,
        parent_id INTEGER NOT NULL REFERENCES parent(id) ON DELETE RESTRICT
      );
      CREATE INDEX child_parent_id_idx ON child(parent_id);
    `);
  },
};

const m2: Migration = {
  version: 2,
  name: "0002_test-2_parent_note",
  up: async (tx) => {
    await tx.exec("ALTER TABLE parent ADD COLUMN note TEXT");
  },
};

const brokenM2: Migration = {
  version: 2,
  name: "0002_test-2_broken",
  up: async (tx) => {
    await tx.exec("CREATE TABLE partial (id INTEGER PRIMARY KEY)");
    await tx.run("INSERT INTO parent (name) VALUES (?)", ["teil"]);
    await tx.exec("ALTER TABLE does_not_exist ADD COLUMN x TEXT");
  },
};

async function foreignKeys(db: TestDb): Promise<number> {
  const row = await db.getFirst<{ foreign_keys: number }>("PRAGMA foreign_keys");
  return row!.foreign_keys;
}

async function userVersion(db: TestDb): Promise<number> {
  const row = await db.getFirst<{ user_version: number }>("PRAGMA user_version");
  return row!.user_version;
}

async function tableNames(db: TestDb): Promise<string[]> {
  const rows = await db.getAll<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name LIMIT 100",
  );
  return rows.map((r) => r.name);
}

async function columns(db: TestDb, table: "parent" | "child"): Promise<string[]> {
  const rows = await db.getAll<{ name: string }>(
    "SELECT name FROM pragma_table_info(?) LIMIT 100",
    [table],
  );
  return rows.map((r) => r.name);
}

describe("PROJ-1 runMigrations", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(async () => {
    await db.close();
  });

  it("AC-1, AC-11: Frisch: fährt alle Migrationen von 0 bis aktuell", async () => {
    const result = await runMigrations(db, [m1, m2]);

    expect(result).toEqual({ data: { from: 0, to: 2 }, error: null });
    expect(await userVersion(db)).toBe(2);
    expect(await tableNames(db)).toEqual(["child", "parent"]);
    expect(await columns(db, "parent")).toEqual(["id", "name", "note"]);
  });

  it("AC-3, AC-11: Upgrade: Seed-Daten der Vorversion bleiben unverändert und lesbar", async () => {
    expect((await runMigrations(db, [m1])).error).toBeNull();
    await db.run("INSERT INTO parent (id, name) VALUES (?, ?)", [1, "Haferflocken"]);
    await db.run("INSERT INTO parent (id, name) VALUES (?, ?)", [2, "Apfel"]);
    await db.run("INSERT INTO child (id, parent_id) VALUES (?, ?)", [10, 1]);

    const result = await runMigrations(db, [m1, m2]);

    expect(result).toEqual({ data: { from: 1, to: 2 }, error: null });
    expect(await userVersion(db)).toBe(2);
    expect(
      await db.getAll("SELECT id, name, note FROM parent ORDER BY id LIMIT 10"),
    ).toEqual([
      { id: 1, name: "Haferflocken", note: null },
      { id: 2, name: "Apfel", note: null },
    ]);
    expect(await db.getAll("SELECT id, parent_id FROM child LIMIT 10")).toEqual([
      { id: 10, parent_id: 1 },
    ]);
  });

  it("AC-2, AC-11: Idempotenz: zweiter Lauf ändert nichts und meldet keinen Fehler", async () => {
    await runMigrations(db, [m1, m2]);
    await db.run("INSERT INTO parent (name) VALUES (?)", ["Reis"]);
    const up = jest.fn(m1.up);

    const result = await runMigrations(db, [{ ...m1, up }, m2]);

    expect(result).toEqual({ data: { from: 2, to: 2 }, error: null });
    expect(up).not.toHaveBeenCalled();
    expect(await userVersion(db)).toBe(2);
    expect(await db.getAll("SELECT name FROM parent LIMIT 10")).toEqual([{ name: "Reis" }]);
  });

  it("AC-4: Fehlschlag: rollt die fehlerhafte Migration zurück, vorherige bleiben", async () => {
    const result = await runMigrations(db, [m1, brokenM2]);

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      kind: "migration_failed",
      migration: "0002_test-2_broken",
    });
    expect(result.error?.message).toContain("0002_test-2_broken");
    expect(result.error?.message).toContain("does_not_exist");
    expect(await userVersion(db)).toBe(1);
    expect(await tableNames(db)).toEqual(["child", "parent"]);
    expect(await db.getAll("SELECT * FROM parent LIMIT 10")).toEqual([]);
  });

  it("AC-5: Fehlschlag: Retry mit korrigierter Liste läuft danach durch", async () => {
    await runMigrations(db, [m1, brokenM2]);

    const result = await runMigrations(db, [m1, m2]);

    expect(result).toEqual({ data: { from: 1, to: 2 }, error: null });
    expect(await userVersion(db)).toBe(2);
  });

  it("AC-6: Neuere DB als App: meldet newer_than_app und ändert nichts", async () => {
    await runMigrations(db, [m1, m2]);
    await db.run("INSERT INTO parent (name) VALUES (?)", ["Brot"]);
    const up = jest.fn(m1.up);

    const result = await runMigrations(db, [{ ...m1, up }]);

    expect(result.data).toBeNull();
    expect(result.error?.kind).toBe("newer_than_app");
    expect(up).not.toHaveBeenCalled();
    expect(await userVersion(db)).toBe(2);
    expect(await columns(db, "parent")).toEqual(["id", "name", "note"]);
    expect(await db.getAll("SELECT name FROM parent LIMIT 10")).toEqual([{ name: "Brot" }]);
  });

  it("AC-10: Foreign Keys sind an: Verweis auf nicht existierenden Eintrag wird abgelehnt", async () => {
    await runMigrations(db, [m1]);

    await expect(
      db.run("INSERT INTO child (id, parent_id) VALUES (?, ?)", [1, 999]),
    ).rejects.toThrow(/FOREIGN KEY/);
    expect(await db.getFirst<{ foreign_keys: number }>("PRAGMA foreign_keys")).toEqual({
      foreign_keys: 1,
    });
  });

  it("AC-3: Tabellen-Rebuild einer Parent-Tabelle behält Kindzeilen trotz ON DELETE CASCADE", async () => {
    const v1: Migration = {
      version: 1,
      name: "0001_test-1_cascade",
      up: async (tx) => {
        await tx.exec(`
          CREATE TABLE food (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
          CREATE TABLE entry (
            id INTEGER PRIMARY KEY,
            food_id INTEGER NOT NULL REFERENCES food(id) ON DELETE CASCADE
          );
        `);
      },
    };
    const rebuild: Migration = {
      version: 2,
      name: "0002_test-2_food_rebuild",
      up: async (tx) => {
        await tx.exec(`
          CREATE TABLE food_new (id INTEGER PRIMARY KEY, name TEXT NOT NULL, kcal REAL NOT NULL DEFAULT 0);
          INSERT INTO food_new (id, name) SELECT id, name FROM food;
          DROP TABLE food;
          ALTER TABLE food_new RENAME TO food;
        `);
      },
    };
    expect((await runMigrations(db, [v1])).error).toBeNull();
    await db.run("INSERT INTO food (id, name) VALUES (?, ?)", [1, "Apfel"]);
    await db.run("INSERT INTO entry (id, food_id) VALUES (?, ?)", [10, 1]);
    await db.run("INSERT INTO entry (id, food_id) VALUES (?, ?)", [11, 1]);

    const result = await runMigrations(db, [v1, rebuild]);

    expect(result).toEqual({ data: { from: 1, to: 2 }, error: null });
    expect(await db.getAll("SELECT id, food_id FROM entry ORDER BY id LIMIT 10")).toEqual([
      { id: 10, food_id: 1 },
      { id: 11, food_id: 1 },
    ]);
    expect(await db.getAll("SELECT id, name, kcal FROM food LIMIT 10")).toEqual([
      { id: 1, name: "Apfel", kcal: 0 },
    ]);
    expect(await foreignKeys(db)).toBe(1);
    // FK-Aktion greift nach dem Lauf wieder.
    await db.run("DELETE FROM food WHERE id = ?", [1]);
    expect(await db.getAll("SELECT id FROM entry LIMIT 10")).toEqual([]);
  });

  it("AC-4: Migration, die eine FK-Verletzung hinterlässt → migration_failed, Rollback, FKs wieder an", async () => {
    const orphan: Migration = {
      version: 2,
      name: "0002_test-2_orphan",
      up: async (tx) => {
        await tx.exec("CREATE TABLE extra (id INTEGER PRIMARY KEY)");
        await tx.run("INSERT INTO child (id, parent_id) VALUES (?, ?)", [1, 999]);
      },
    };

    const result = await runMigrations(db, [m1, orphan]);

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({ kind: "migration_failed", migration: "0002_test-2_orphan" });
    expect(result.error?.message).toContain("Foreign-Key-Verletzung");
    expect(await userVersion(db)).toBe(1);
    expect(await tableNames(db)).toEqual(["child", "parent"]);
    expect(await db.getAll("SELECT * FROM child LIMIT 10")).toEqual([]);
    expect(await foreignKeys(db)).toBe(1);
  });

  it("foreign_keys ist nach erfolgreichem und fehlgeschlagenem Lauf wieder 1", async () => {
    await runMigrations(db, [m1]);
    expect(await foreignKeys(db)).toBe(1);
    await runMigrations(db, [m1, brokenM2]);
    expect(await foreignKeys(db)).toBe(1);
  });

  it.each<[string, Migration[]]>([
    ["Lücke in den Versionen", [m1, { ...m2, version: 3, name: "0003_test-2_parent_note" }]],
    ["Start nicht bei 1", [m2]],
    ["Präfix passt nicht zur Version", [m1, { ...m2, name: "0005_test-2_parent_note" }]],
    ["Name ohne Feature-ID", [{ ...m1, name: "0001_parents" }]],
    ["doppelter Name", [m1, { ...m1, version: 2 }]],
  ])("ungültige Liste (%s): invalid_migrations, nichts ausgeführt", async (_label, list) => {
    const result = await runMigrations(db, list);

    expect(result.data).toBeNull();
    expect(result.error?.kind).toBe("invalid_migrations");
    expect(await userVersion(db)).toBe(0);
    expect(await tableNames(db)).toEqual([]);
  });
});

describe("PROJ-1 App-Migrationsliste (lib/db/migrations.ts)", () => {
  it("ist valide", () => {
    expect(validateMigrations(appMigrations)).toBeNull();
  });

  it("läuft frisch durch und ist idempotent", async () => {
    const db = createTestDb();
    try {
      const first = await runMigrations(db, appMigrations);
      expect(first).toEqual({ data: { from: 0, to: appMigrations.length }, error: null });
      expect(await userVersion(db)).toBe(appMigrations.length);

      const second = await runMigrations(db, appMigrations);
      expect(second).toEqual({
        data: { from: appMigrations.length, to: appMigrations.length },
        error: null,
      });
    } finally {
      await db.close();
    }
  });
});

describe("PROJ-2 Migration 0001_proj-2_foods (echte App-Liste)", () => {
  type ColumnInfo = { name: string; type: string; notnull: number; pk: number };
  type IndexInfo = { name: string; unique: number; partial: number };

  const validFood = {
    name: "Haferflocken",
    name_key: "haferflocken",
    kcal: 370,
    carbs: 58.7,
    fat: 7,
    protein: 13.5,
    piece_grams: null as number | null,
    barcode: null as string | null,
  };

  async function insertFood(db: TestDb, overrides: Partial<typeof validFood> = {}) {
    const f = { ...validFood, ...overrides };
    return db.run(
      `INSERT INTO foods (name, name_key, kcal, carbs, fat, protein, piece_grams, barcode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [f.name, f.name_key, f.kcal, f.carbs, f.fat, f.protein, f.piece_grams, f.barcode],
    );
  }

  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(async () => {
    await db.close();
  });

  it("AC-21: Frisch: legt foods mit Spalten, Indizes und user_version an", async () => {
    // Schema auf dem Stand von 0001 festhalten — spätere Migrationen dürfen foods erweitern.
    expect(appMigrations.length).toBeGreaterThanOrEqual(1);
    expect(appMigrations[0].name).toBe("0001_proj-2_foods");
    const result = await runMigrations(db, appMigrations.slice(0, 1));

    expect(result).toEqual({ data: { from: 0, to: 1 }, error: null });
    expect(await userVersion(db)).toBe(1);
    expect(await tableNames(db)).toContain("foods");

    const cols = await db.getAll<ColumnInfo>(
      "SELECT name, type, \"notnull\", pk FROM pragma_table_info('foods') LIMIT 100",
    );
    expect(cols).toEqual([
      { name: "id", type: "INTEGER", notnull: 0, pk: 1 },
      { name: "name", type: "TEXT", notnull: 1, pk: 0 },
      { name: "name_key", type: "TEXT", notnull: 1, pk: 0 },
      { name: "kcal", type: "REAL", notnull: 1, pk: 0 },
      { name: "carbs", type: "REAL", notnull: 1, pk: 0 },
      { name: "fat", type: "REAL", notnull: 1, pk: 0 },
      { name: "protein", type: "REAL", notnull: 1, pk: 0 },
      { name: "piece_grams", type: "REAL", notnull: 0, pk: 0 },
      { name: "barcode", type: "TEXT", notnull: 0, pk: 0 },
      { name: "created_at", type: "INTEGER", notnull: 1, pk: 0 },
      { name: "updated_at", type: "INTEGER", notnull: 1, pk: 0 },
    ]);

    const indexes = await db.getAll<IndexInfo>(
      "SELECT name, \"unique\", partial FROM pragma_index_list('foods') ORDER BY name LIMIT 100",
    );
    expect(indexes).toEqual([
      { name: "foods_barcode_uidx", unique: 1, partial: 1 },
      { name: "foods_name_key_idx", unique: 0, partial: 0 },
    ]);
    expect(
      await db.getAll<{ name: string }>(
        "SELECT name FROM pragma_index_info('foods_name_key_idx') LIMIT 10",
      ),
    ).toEqual([{ name: "name_key" }]);
    expect(
      await db.getAll<{ name: string }>(
        "SELECT name FROM pragma_index_info('foods_barcode_uidx') LIMIT 10",
      ),
    ).toEqual([{ name: "barcode" }]);
  });

  it("AC-21: Frisch: gültige Zeile wird gespeichert, Zeitstempel als ms gesetzt", async () => {
    await runMigrations(db, appMigrations);
    const before = Date.now();

    const { lastInsertRowId } = await insertFood(db, { piece_grams: 40, barcode: "40000000" });

    const row = await db.getFirst<Record<string, unknown>>(
      "SELECT * FROM foods WHERE id = ?",
      [lastInsertRowId],
    );
    expect(row).toMatchObject({ ...validFood, piece_grams: 40, barcode: "40000000" });
    expect(typeof row!.created_at).toBe("number");
    expect(row!.created_at as number).toBeGreaterThanOrEqual(before - 1000);
    expect(row!.created_at as number).toBeLessThanOrEqual(Date.now() + 1000);
    expect(row!.updated_at).toBe(row!.created_at);
  });

  it("AC-21: Frisch: Grenzwerte sind erlaubt (kcal 0/900, C+F+E = 100, 8/14-stelliger Barcode)", async () => {
    await runMigrations(db, appMigrations);

    await expect(insertFood(db, { kcal: 0, carbs: 0, fat: 0, protein: 0 })).resolves.toBeDefined();
    await expect(
      insertFood(db, { kcal: 900, carbs: 0, fat: 100, protein: 0, barcode: "12345678" }),
    ).resolves.toBeDefined();
    await expect(
      insertFood(db, { carbs: 50, fat: 25, protein: 25, barcode: "12345678901234" }),
    ).resolves.toBeDefined();
  });

  it.each<[string, Partial<typeof validFood>]>([
    ["leerer Name", { name: "   " }],
    ["kcal negativ", { kcal: -1 }],
    ["kcal über 900", { kcal: 900.5 }],
    ["Carbs negativ", { carbs: -0.1 }],
    ["Fett über 100", { carbs: 0, fat: 100.1, protein: 0 }],
    ["Eiweiß über 100", { carbs: 0, fat: 0, protein: 101 }],
    ["C + F + E über 100", { carbs: 50, fat: 30, protein: 20.5 }],
    ["Stückgewicht 0", { piece_grams: 0 }],
    ["Stückgewicht negativ", { piece_grams: -5 }],
    ["Barcode zu kurz", { barcode: "1234567" }],
    ["Barcode zu lang", { barcode: "123456789012345" }],
    ["Barcode mit Buchstaben", { barcode: "1234567a" }],
    ["Barcode leer", { barcode: "" }],
    ["kcal als Text", { kcal: "viel" as unknown as number }],
  ])("AC-21: Prüfregel in der Tabelle lehnt ab: %s", async (_label, overrides) => {
    await runMigrations(db, appMigrations);

    await expect(insertFood(db, overrides)).rejects.toThrow(/CHECK constraint failed/);
    expect(await db.getAll("SELECT id FROM foods LIMIT 10")).toEqual([]);
  });

  it("AC-21: Barcode ist eindeutig, mehrere Lebensmittel ohne Barcode sind erlaubt", async () => {
    await runMigrations(db, appMigrations);

    await insertFood(db, { barcode: "4000417025005" });
    await expect(insertFood(db, { name: "Andere", barcode: "4000417025005" })).rejects.toThrow(
      /UNIQUE constraint failed/,
    );
    await insertFood(db, { barcode: null });
    await insertFood(db, { barcode: null });
    // Doppelte Namen sind erlaubt.
    await insertFood(db, { barcode: null });
    expect(await db.getFirst("SELECT count(*) AS n FROM foods")).toEqual({ n: 4 });
  });

  it("AC-21: gelöschte ids werden nicht wiederverwendet", async () => {
    await runMigrations(db, appMigrations);
    const first = await insertFood(db);
    await db.run("DELETE FROM foods WHERE id = ?", [first.lastInsertRowId]);

    const second = await insertFood(db);

    expect(second.lastInsertRowId).toBeGreaterThan(first.lastInsertRowId);
  });

  it("AC-21: Upgrade: PROJ-1-Datenbank (user_version 0) mit Altdaten → foods neu, Altdaten unverändert", async () => {
    // Stand PROJ-1: keine Fachtabellen, user_version 0. Eine Hilfstabelle mit
    // Seed-Daten steht für beliebige vorhandene Inhalte, die erhalten bleiben müssen.
    await db.exec("CREATE TABLE legacy_note (id INTEGER PRIMARY KEY, text TEXT NOT NULL)");
    await db.run("INSERT INTO legacy_note (id, text) VALUES (?, ?)", [1, "Äpfel"]);
    await db.run("INSERT INTO legacy_note (id, text) VALUES (?, ?)", [2, "Brot"]);
    expect(await userVersion(db)).toBe(0);

    const result = await runMigrations(db, appMigrations);

    expect(result).toEqual({ data: { from: 0, to: appMigrations.length }, error: null });
    expect(await userVersion(db)).toBe(appMigrations.length);
    expect(await tableNames(db)).toEqual(expect.arrayContaining(["foods", "legacy_note"]));
    expect(await db.getAll("SELECT id, text FROM legacy_note ORDER BY id LIMIT 10")).toEqual([
      { id: 1, text: "Äpfel" },
      { id: 2, text: "Brot" },
    ]);
    await insertFood(db);
    expect(await db.getFirst("SELECT count(*) AS n FROM foods")).toEqual({ n: 1 });
    expect(await foreignKeys(db)).toBe(1);
  });

  it("AC-21: Idempotenz: zweiter Lauf ändert weder Schema noch Daten", async () => {
    await runMigrations(db, appMigrations);
    await insertFood(db, { barcode: "40000000" });
    const schemaBefore = await db.getAll(
      "SELECT type, name, sql FROM sqlite_master ORDER BY name LIMIT 100",
    );
    const rowsBefore = await db.getAll("SELECT * FROM foods ORDER BY id LIMIT 10");

    const result = await runMigrations(db, appMigrations);

    expect(result).toEqual({
      data: { from: appMigrations.length, to: appMigrations.length },
      error: null,
    });
    expect(await userVersion(db)).toBe(appMigrations.length);
    expect(
      await db.getAll("SELECT type, name, sql FROM sqlite_master ORDER BY name LIMIT 100"),
    ).toEqual(schemaBefore);
    expect(await db.getAll("SELECT * FROM foods ORDER BY id LIMIT 10")).toEqual(rowsBefore);
  });
});

describe("PROJ-1 Transaktion", () => {
  it("serialisiert Zugriffe: ein paralleler Schreibzugriff landet nicht in der Transaktion", async () => {
    const db = createTestDb();
    try {
      await db.exec("CREATE TABLE t (v TEXT NOT NULL)");
      const failing = db.transaction(async (tx) => {
        await tx.run("INSERT INTO t (v) VALUES (?)", ["in-tx"]);
        await new Promise((resolve) => setTimeout(resolve, 5));
        throw new Error("abbrechen");
      });
      const outside = db.run("INSERT INTO t (v) VALUES (?)", ["outside"]);

      await expect(failing).rejects.toThrow("abbrechen");
      await outside;
      expect(await db.getAll("SELECT v FROM t LIMIT 10")).toEqual([{ v: "outside" }]);
    } finally {
      await db.close();
    }
  });

  it("wartet nicht awaitete tx-Aufrufe vor COMMIT ab", async () => {
    const db = createTestDb();
    try {
      await db.exec("CREATE TABLE t (v TEXT NOT NULL)");
      await db.transaction(async (tx) => {
        void tx.run("INSERT INTO t (v) VALUES (?)", ["a"]);
        void tx.run("INSERT INTO t (v) VALUES (?)", ["b"]);
      });
      expect(await db.getAll("SELECT v FROM t ORDER BY v LIMIT 10")).toEqual([
        { v: "a" },
        { v: "b" },
      ]);
    } finally {
      await db.close();
    }
  });

  it("rollt zurück, wenn ein nicht awaiteter tx-Aufruf fehlschlägt", async () => {
    const db = createTestDb();
    try {
      await db.exec("CREATE TABLE t (v TEXT NOT NULL)");
      const result = db.transaction(async (tx) => {
        await tx.run("INSERT INTO t (v) VALUES (?)", ["ok"]);
        void tx.run("INSERT INTO t (v) VALUES (?)", [null]);
        return "fertig";
      });
      await expect(result).rejects.toThrow(/NOT NULL/);
      expect(await db.getAll("SELECT v FROM t LIMIT 10")).toEqual([]);
    } finally {
      await db.close();
    }
  });

  it("lehnt tx-Aufrufe nach Transaktionsende ab", async () => {
    const db = createTestDb();
    try {
      let leaked: import("./types").DbExecutor | undefined;
      await db.transaction(async (tx) => {
        leaked = tx;
      });
      await expect(leaked!.getFirst("SELECT 1")).rejects.toThrow(/bereits beendet/);
    } finally {
      await db.close();
    }
  });
});

describe("PROJ-1 Test-Implementierung (expo-sqlite-Semantik)", () => {
  it("run() akzeptiert INSERT … RETURNING; getFirst/getAll akzeptieren Statements ohne Ergebnis", async () => {
    const db = createTestDb();
    try {
      await db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT NOT NULL)");
      expect(await db.run("INSERT INTO t (v) VALUES (?) RETURNING id", ["x"])).toEqual({
        changes: 1,
        lastInsertRowId: 1,
      });
      expect(await db.getFirst("INSERT INTO t (v) VALUES (?)", ["y"])).toBeNull();
      expect(await db.getAll("UPDATE t SET v = ? WHERE id = ?", ["z", 1])).toEqual([]);
      expect(await db.getAll("SELECT id, v FROM t ORDER BY id LIMIT 10")).toEqual([
        { id: 1, v: "z" },
        { id: 2, v: "y" },
      ]);
    } finally {
      await db.close();
    }
  });
});
