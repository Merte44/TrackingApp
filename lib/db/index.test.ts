/**
 * @jest-environment node
 */
import { createTestDb, type TestDb } from "./testing";
import type { Migration } from "./types";

// expo-sqlite ist nativ — der Öffner wird durch die In-Memory-DB ersetzt.
const mockOpen = jest.fn();
jest.mock("./expo", () => ({ openExpoDatabase: () => mockOpen() }));

const mockMigrations: Migration[] = [];
jest.mock("./migrations", () => ({
  get migrations() {
    return mockMigrations;
  },
}));

type IndexModule = typeof import("./index");

function loadIndex(): IndexModule {
  let mod: IndexModule | undefined;
  jest.isolateModules(() => {
    mod = jest.requireActual<IndexModule>("./index");
  });
  return mod!;
}

const ok: Migration = {
  version: 1,
  name: "0001_test-1_items",
  up: async (tx) => {
    await tx.exec("CREATE TABLE items (id INTEGER PRIMARY KEY)");
  },
};

const broken: Migration = {
  version: 2,
  name: "0002_test-1_broken",
  up: async (tx) => {
    await tx.exec("ALTER TABLE nope ADD COLUMN x TEXT");
  },
};

function handle(db: TestDb, overrides: Partial<TestDb> = {}): TestDb {
  return { ...db, close: jest.fn(async () => undefined), ...overrides };
}

describe("lib/db index", () => {
  let testDb: TestDb;

  beforeEach(() => {
    testDb = createTestDb();
    mockOpen.mockReset();
    // Jedes Öffnen liefert einen eigenen Handle auf dieselbe In-Memory-DB; close() lässt die
    // Daten stehen — wie die Datei auf dem Gerät, die ein Neu-Öffnen überlebt.
    mockOpen.mockImplementation(async () => handle(testDb));
    mockMigrations.length = 0;
  });

  afterEach(async () => {
    await testDb.close();
  });

  it("getDb() wirft vor initDatabase()", () => {
    const { getDb } = loadIndex();
    expect(() => getDb()).toThrow(/nicht initialisiert/);
  });

  it("setDbForTesting ersetzt die Verbindung; null setzt zurück", async () => {
    const { getDb, setDbForTesting } = loadIndex();
    setDbForTesting(testDb);
    expect(getDb()).toBe(testDb);
    expect(await getDb().getFirst("SELECT 1 AS one")).toEqual({ one: 1 });

    setDbForTesting(null);
    expect(() => getDb()).toThrow();
  });

  it("initDatabase(): frisch → migriert, getDb() danach nutzbar; zweiter Aufruf öffnet nicht neu", async () => {
    mockMigrations.push(ok);
    const { initDatabase, getDb } = loadIndex();

    expect(await initDatabase()).toEqual({ data: { version: 1 }, error: null });
    expect(await getDb().getAll("SELECT name FROM sqlite_master WHERE name = ? LIMIT 1", ["items"]))
      .toEqual([{ name: "items" }]);

    expect(await initDatabase()).toEqual({ data: { version: 1 }, error: null });
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it("initDatabase(): open_failed, Retry öffnet erneut", async () => {
    mockOpen.mockRejectedValueOnce(new Error("disk I/O error"));
    const { initDatabase, getDb } = loadIndex();

    const failed = await initDatabase();
    expect(failed.data).toBeNull();
    expect(failed.error).toMatchObject({
      kind: "open_failed",
      message: "Die Datenbank konnte nicht geöffnet werden.",
      detail: "disk I/O error",
    });
    expect(() => getDb()).toThrow();

    expect(await initDatabase()).toEqual({ data: { version: 0 }, error: null });
    expect(mockOpen).toHaveBeenCalledTimes(2);
  });

  it("initDatabase(): user_version nicht lesbar → open_failed, Verbindung geschlossen, Retry öffnet neu", async () => {
    const close = jest.fn(async () => undefined);
    const broken = {
      ...testDb,
      getFirst: jest.fn().mockRejectedValue(new Error("file is not a database")),
      close,
    };
    mockOpen.mockResolvedValueOnce(broken);
    const { initDatabase, getDb } = loadIndex();

    const failed = await initDatabase();
    expect(failed.error).toMatchObject({ kind: "open_failed", detail: "file is not a database" });
    expect(close).toHaveBeenCalledTimes(1);
    expect(() => getDb()).toThrow();

    expect(await initDatabase()).toEqual({ data: { version: 0 }, error: null });
    expect(mockOpen).toHaveBeenCalledTimes(2);
    expect(await getDb().getFirst("SELECT 1 AS one")).toEqual({ one: 1 });
  });

  it("initDatabase(): migration_failed mit Name, getDb() bleibt gesperrt, Retry möglich", async () => {
    mockMigrations.push(ok, broken);
    const { initDatabase, getDb } = loadIndex();

    const failed = await initDatabase();
    expect(failed.error).toMatchObject({
      kind: "migration_failed",
      message:
        "Die Daten konnten nicht auf die neue App-Version umgestellt werden. Deine Daten sind unverändert.",
      migration: "0002_test-1_broken",
    });
    expect(failed.error?.detail).toContain("nope");
    expect(() => getDb()).toThrow();
    expect(await testDb.getFirst("PRAGMA user_version")).toEqual({ user_version: 1 });

    mockMigrations.pop();
    expect(await initDatabase()).toEqual({ data: { version: 1 }, error: null });
    // Retry öffnet frisch statt die Verbindung des Fehlschlags weiterzuverwenden.
    expect(mockOpen).toHaveBeenCalledTimes(2);
  });

  it("initDatabase(): Foreign Keys nicht wiederherstellbar → Verbindung verworfen, Retry läuft mit Foreign Keys an", async () => {
    mockMigrations.push(ok);
    const close = jest.fn(async () => undefined);
    const failing = handle(testDb, {
      exec: (sql: string) =>
        sql === "PRAGMA foreign_keys = ON"
          ? Promise.reject(new Error("foreign_keys lässt sich nicht setzen"))
          : testDb.exec(sql),
      close,
    });
    mockOpen.mockResolvedValueOnce(failing);
    // Ein frisches Öffnen setzt die Pragmas neu (wie openExpoDatabase).
    mockOpen.mockImplementationOnce(async () => {
      await testDb.exec("PRAGMA foreign_keys = ON");
      return handle(testDb);
    });
    const { initDatabase, getDb } = loadIndex();

    const failed = await initDatabase();
    expect(failed.error).toMatchObject({ kind: "migration_failed" });
    expect(close).toHaveBeenCalledTimes(1);
    expect(() => getDb()).toThrow();

    expect(await initDatabase()).toEqual({ data: { version: 1 }, error: null });
    expect(mockOpen).toHaveBeenCalledTimes(2);
    expect(await getDb().getFirst("PRAGMA foreign_keys")).toEqual({ foreign_keys: 1 });
  });

  it("initDatabase(): newer_than_app", async () => {
    await testDb.exec("PRAGMA user_version = 5");
    const { initDatabase } = loadIndex();

    const result = await initDatabase();
    expect(result.error).toMatchObject({
      kind: "newer_than_app",
      message:
        "Die Daten stammen von einer neueren App-Version. Bitte die aktuelle Version installieren.",
    });
    expect(await testDb.getFirst("PRAGMA user_version")).toEqual({ user_version: 5 });
  });

  it("initDatabase(): gleichzeitige Aufrufe teilen sich einen Lauf", async () => {
    mockMigrations.push(ok);
    const { initDatabase } = loadIndex();

    const [a, b] = await Promise.all([initDatabase(), initDatabase()]);
    expect(a).toEqual(b);
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });
});
