import "../global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { cssInterop } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { DatabaseError } from "@/components/db/DatabaseError";
import { DB_INIT_MESSAGES, initDatabase, type DbInitError } from "@/lib/db";

// GestureHandlerRootView ist kein von NativeWind gemappter Baustein — className auf style abbilden.
cssInterop(GestureHandlerRootView, { className: "style" });

/**
 * Einheitliche Darstellung aller Unter-Screens als formSheet (PRD).
 *
 * `contentStyle.bottom: 0`: react-native-screens (4.x, iOS) legt den Inhalt eines formSheets
 * absichtlich nur oben/links/rechts fest (`position: absolute` ohne `bottom`, wegen
 * `fitToContents`). Der Inhalt ist dann nur so hoch wie er selbst — `flex-1` greift nicht,
 * unter dem Inhalt erscheint die Theme-Farbe des Screens, und Listen/ScrollViews kennen
 * ihre sichtbare Höhe nicht. Bei festem Detent `[1]` ändert sich die Sheet-Höhe nie, also
 * darf der Inhalt bis zum unteren Rand gespannt werden: `bg-background` der Screens reicht
 * dann bis unten, ganz ohne Farbwert im JS.
 */
const FORM_SHEET_OPTIONS = {
  presentation: "formSheet" as const,
  headerShown: false,
  sheetAllowedDetents: [1],
  sheetGrabberVisible: true,
  contentStyle: { bottom: 0 },
};

// Splash bleibt stehen, bis die Datenbank bereit ist (kein eigener Lade-Screen).
SplashScreen.preventAutoHideAsync().catch(() => {});

type DbState = { status: "loading" } | { status: "ready" } | { status: "error"; error: DbInitError };

async function openDatabase(): Promise<DbState> {
  try {
    const { error } = await initDatabase();
    return error ? { status: "error", error } : { status: "ready" };
  } catch (cause) {
    // initDatabase liefert Fehler als Ergebnis; das hier fängt nur Unerwartetes ab, damit der Splash nie hängen bleibt.
    const detail = cause instanceof Error ? cause.message : String(cause);
    return {
      status: "error",
      error: { kind: "open_failed", message: DB_INIT_MESSAGES.open_failed, detail, cause },
    };
  }
}

export default function RootLayout() {
  const [db, setDb] = useState<DbState>({ status: "loading" });
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    openDatabase().then((state) => {
      if (!cancelled) setDb(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (db.status !== "loading") SplashScreen.hideAsync().catch(() => {});
  }, [db.status]);

  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      setDb(await openDatabase());
    } finally {
      setRetrying(false);
    }
  }, []);

  if (db.status === "loading") return null;
  if (db.status === "error") {
    return <DatabaseError error={db.error} retrying={retrying} onRetry={retry} />;
  }
  return (
    <GestureHandlerRootView className="flex-1">
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Unter-Screens als formSheet (PRD). */}
        <Stack.Screen name="foods" options={FORM_SHEET_OPTIONS} />
        <Stack.Screen name="food-form" options={FORM_SHEET_OPTIONS} />
      </Stack>
    </GestureHandlerRootView>
  );
}
