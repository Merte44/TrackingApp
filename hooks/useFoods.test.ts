/**
 * @jest-environment node
 */
import { runMigrations, setDbForTesting } from "@/lib/db";
import { migrations } from "@/lib/db/migrations";
import { createTestDb, type TestDb } from "@/lib/db/testing";
import { createFood, deleteFood, type FoodInput } from "@/lib/foods";

import { createFoodsLoader, foodListCreateName, selectFoodListView, type FoodsState } from "./useFoods";

// expo-sqlite ist nativ — in Jest steckt hinter getDb() die In-Memory-DB.
jest.mock("@/lib/db/expo", () => ({ openExpoDatabase: jest.fn() }));

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

/** Lässt jedes Lesen scheitern (simulierter Ladefehler). */
function breakReads(): void {
  const fail = async () => {
    throw new Error("disk I/O error");
  };
  setDbForTesting({ ...db, getAll: fail, getFirst: fail });
}

/** Wartet, bis alle anstehenden Promises (DB-Aufrufe) erledigt sind. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Startet einen Loader und merkt sich den jeweils letzten Zustand. */
function start(query = "") {
  const states: FoodsState[] = [];
  const loader = createFoodsLoader(query, (s) => states.push(s));
  return {
    loader,
    states,
    last: () => states[states.length - 1],
    names: () => (states[states.length - 1].foods ?? []).map((f) => f.name),
  };
}

async function seed(...names: string[]): Promise<void> {
  for (const name of names) {
    const { error } = await createFood({ ...base, name });
    expect(error).toBeNull();
  }
}

describe("PROJ-2 hooks/useFoods — createFoodsLoader", () => {
  it("lädt beim Start: erst Ladezustand, dann die Liste", async () => {
    await seed("Skyr");
    const run = start();
    expect(run.last()).toMatchObject({ loading: true, foods: null, error: null });
    await flush();
    expect(run.last()).toMatchObject({ loading: false, error: null, query: "" });
    expect(run.names()).toEqual(["Skyr"]);
    run.loader.dispose();
  });

  it("AC-8: liefert die Liste alphabetisch ohne Beachtung der Groß-/Kleinschreibung", async () => {
    await seed("banane", "Äpfel", "Zwieback", "apfelmus", "Birne");
    const run = start();
    await flush();
    expect(run.names()).toEqual(["Äpfel", "apfelmus", "banane", "Birne", "Zwieback"]);
    run.loader.dispose();
  });

  it("AC-9: Filter „apf“ findet „Äpfel“", async () => {
    await seed("Äpfel", "Banane");
    const run = start("apf");
    await flush();
    expect(run.names()).toEqual(["Äpfel"]);
    expect(run.last().query).toBe("apf");
    run.loader.dispose();
  });

  it("AC-9: neuer Suchbegriff lädt neu und filtert", async () => {
    await seed("Äpfel", "Banane");
    const run = start();
    await flush();
    run.loader.setQuery("ban");
    await flush();
    expect(run.names()).toEqual(["Banane"]);
    expect(run.last().query).toBe("ban");
    run.loader.dispose();
  });

  it("verwirft veraltete Antworten, wenn der Suchbegriff schnell wechselt", async () => {
    await seed("Äpfel", "Banane");
    const run = start();
    run.loader.setQuery("a");
    run.loader.setQuery("ban");
    await flush();
    expect(run.names()).toEqual(["Banane"]);
    expect(run.last().query).toBe("ban");
    run.loader.dispose();
  });

  it("lädt neu, wenn lib/foods eine Änderung meldet (anlegen)", async () => {
    const run = start();
    await flush();
    expect(run.names()).toEqual([]);
    await seed("Skyr");
    await flush();
    expect(run.names()).toEqual(["Skyr"]);
    run.loader.dispose();
  });

  it("AC-15: nach deleteFood verschwindet die Zeile ohne weiteres Zutun", async () => {
    await seed("Skyr", "Banane");
    const run = start();
    await flush();
    const skyr = run.last().foods!.find((f) => f.name === "Skyr")!;
    const { error } = await deleteFood(skyr.id);
    expect(error).toBeNull();
    await flush();
    expect(run.names()).toEqual(["Banane"]);
    run.loader.dispose();
  });

  it("hört nach dispose nicht mehr auf Änderungen", async () => {
    const run = start();
    await flush();
    run.loader.dispose();
    const count = run.states.length;
    await seed("Skyr");
    await flush();
    expect(run.states.length).toBe(count);
  });

  it("Ladefehler: Zustand trägt den Fehler statt einer leeren Liste", async () => {
    breakReads();
    const run = start();
    await flush();
    expect(run.last().loading).toBe(false);
    expect(run.last().foods).toBeNull();
    expect(run.last().error?.kind).toBe("db");
    run.loader.dispose();
  });

  it("Ladefehler: „Erneut versuchen“ (reload) lädt neu und zeigt die Liste", async () => {
    await seed("Skyr");
    breakReads();
    const run = start();
    await flush();
    expect(run.last().error).not.toBeNull();
    setDbForTesting(db);
    run.loader.reload();
    expect(run.last().loading).toBe(true);
    await flush();
    expect(run.last().error).toBeNull();
    expect(run.names()).toEqual(["Skyr"]);
    run.loader.dispose();
  });

  it("Ladefehler: während des Neuladens zeigt die Liste „loading“ statt „error“", async () => {
    breakReads();
    const run = start();
    await flush();
    expect(selectFoodListView(run.last())).toBe("error");
    setDbForTesting(db);
    run.loader.reload();
    expect(selectFoodListView(run.last())).toBe("loading");
    run.loader.dispose();
  });

  it("Ladefehler: mehrfaches „Erneut versuchen“ ist harmlos (nur die letzte Antwort zählt)", async () => {
    await seed("Skyr");
    breakReads();
    const run = start();
    await flush();
    setDbForTesting(db);
    run.loader.reload();
    run.loader.reload();
    run.loader.reload();
    await flush();
    const settled = run.states.filter((s) => !s.loading);
    expect(settled).toHaveLength(2); // Fehler beim Start + genau ein Ergebnis nach dem Neuladen
    expect(run.last().error).toBeNull();
    expect(run.names()).toEqual(["Skyr"]);
    run.loader.dispose();
  });
});

describe("PROJ-2 hooks/useFoods — selectFoodListView", () => {
  const food = { id: 1, name: "Skyr", kcal: 63, carbs: 4, fat: 0.2, protein: 11, pieceGrams: null, barcode: null };

  it("lädt noch → loading", () => {
    expect(selectFoodListView({ foods: null, loading: true, error: null, query: "" })).toBe("loading");
  });

  it("Ladefehler → error (nicht der Leerzustand)", () => {
    expect(
      selectFoodListView({
        foods: null,
        loading: false,
        error: { kind: "db", message: "x" },
        query: "",
      }),
    ).toBe("error");
  });

  it("AC-1: keine eigenen Lebensmittel und kein Suchbegriff → empty", () => {
    expect(selectFoodListView({ foods: [], loading: false, error: null, query: "" })).toBe("empty");
    expect(selectFoodListView({ foods: [], loading: false, error: null, query: "   " })).toBe("empty");
  });

  it("AC-10: kein Treffer zum Suchbegriff → no_match", () => {
    expect(selectFoodListView({ foods: [], loading: false, error: null, query: "Quarkkeulchen" })).toBe(
      "no_match",
    );
  });

  it("Treffer → list (auch während ein neuer Suchbegriff lädt)", () => {
    expect(selectFoodListView({ foods: [food], loading: false, error: null, query: "" })).toBe("list");
    expect(selectFoodListView({ foods: [food], loading: true, error: null, query: "sk" })).toBe("list");
  });
});

describe("PROJ-2 hooks/useFoods — foodListCreateName", () => {
  it("AC-11: „Neues Lebensmittel“ im Kein-Treffer-Zustand übernimmt den Suchbegriff des angezeigten Ergebnisses", () => {
    // Die Prop kann schon weiter sein (Tippen läuft), angezeigt wird das Ergebnis zu state.query.
    expect(foodListCreateName({ foods: [], loading: true, error: null, query: "Quarkkeulchen" })).toBe("Quarkkeulchen");
  });

  it("AC-1: Leerzustand ohne Suchbegriff → leerer Name", () => {
    expect(foodListCreateName({ foods: [], loading: false, error: null, query: "  " })).toBe("");
  });

  it("Liste mit Treffern → leerer Name", () => {
    const food = { id: 1, name: "Skyr", kcal: 63, carbs: 4, fat: 0.2, protein: 11, pieceGrams: null, barcode: null };
    expect(foodListCreateName({ foods: [food], loading: false, error: null, query: "sk" })).toBe("");
  });
});
