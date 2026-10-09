/**
 * Eigene Lebensmittel (PROJ-2) — Liste laden, filtern, bei Änderungen neu laden.
 *
 * Die Logik steckt in `createFoodsLoader` (ohne React, direkt testbar); `useFoods`
 * hängt sie an den Komponenten-Lebenszyklus. Die Liste aktualisiert sich über
 * `subscribeFoods`, nicht über Navigations-Ereignisse — so funktioniert sie
 * unabhängig davon, wo sie eingebettet ist.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { listFoods, subscribeFoods, type Food, type FoodError } from "@/lib/foods";

export interface FoodsState {
  /** Zuletzt geladene Liste; `null` vor dem ersten Laden und nach einem Ladefehler. */
  foods: Food[] | null;
  /** Ein Ladevorgang läuft (die bisherige Liste bleibt so lange sichtbar). */
  loading: boolean;
  /** Ladefehler (`db`), sonst `null`. */
  error: FoodError | null;
  /** Suchbegriff, zu dem `foods` gehört. */
  query: string;
}

/** Welcher Zustand der Liste angezeigt wird. */
export type FoodListView = "loading" | "error" | "empty" | "no_match" | "list";

export interface FoodsLoader {
  setQuery(query: string): void;
  /** Lädt mit dem aktuellen Suchbegriff neu („Erneut versuchen“). */
  reload(): void;
  /** Meldet sich ab; danach kommen keine Zustände mehr. */
  dispose(): void;
}

export const INITIAL_FOODS_STATE: FoodsState = { foods: null, loading: true, error: null, query: "" };

/**
 * Lädt `listFoods(query)` sofort und erneut bei jeder von `lib/foods` gemeldeten
 * Änderung sowie bei neuem Suchbegriff. Antworten zu überholten Anfragen werden verworfen.
 */
export function createFoodsLoader(initialQuery: string, onState: (state: FoodsState) => void): FoodsLoader {
  let query = initialQuery;
  let state: FoodsState = { ...INITIAL_FOODS_STATE, query };
  let request = 0;
  let disposed = false;

  const emit = (next: FoodsState) => {
    state = next;
    onState(next);
  };

  const load = () => {
    if (disposed) return;
    const id = ++request;
    const forQuery = query;
    emit({ ...state, loading: true });
    listFoods(forQuery).then(({ data, error }) => {
      if (disposed || id !== request) return;
      emit(
        error
          ? { foods: null, loading: false, error, query: forQuery }
          : { foods: data, loading: false, error: null, query: forQuery },
      );
    });
  };

  const unsubscribe = subscribeFoods(load);
  load();

  return {
    setQuery(next) {
      if (next === query) return;
      query = next;
      load();
    },
    reload: load,
    dispose() {
      disposed = true;
      unsubscribe();
    },
  };
}

/** Wählt den sichtbaren Zustand: Ladefehler vor Leer; leer ohne Suchbegriff vs. kein Treffer. */
export function selectFoodListView(state: FoodsState): FoodListView {
  if (state.error) return "error";
  if (state.foods === null) return "loading";
  if (state.foods.length > 0) return "list";
  return state.query.trim() === "" ? "empty" : "no_match";
}

export interface UseFoodsResult extends FoodsState {
  view: FoodListView;
  reload: () => void;
}

/** Eigene Lebensmittel zum Suchbegriff; lädt neu, wenn `lib/foods` eine Änderung meldet. */
export function useFoods(query: string): UseFoodsResult {
  const [state, setState] = useState<FoodsState>({ ...INITIAL_FOODS_STATE, query });
  const loaderRef = useRef<FoodsLoader | null>(null);
  // Start-Suchbegriff nur für den ersten Ladevorgang; Wechsel laufen über setQuery.
  const initialQuery = useRef(query);

  useEffect(() => {
    const loader = createFoodsLoader(initialQuery.current, setState);
    loaderRef.current = loader;
    return () => {
      loader.dispose();
      loaderRef.current = null;
    };
  }, []);

  useEffect(() => {
    loaderRef.current?.setQuery(query);
  }, [query]);

  const reload = useCallback(() => loaderRef.current?.reload(), []);

  return { ...state, view: selectFoodListView(state), reload };
}
