import "../global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";

import { DatabaseError } from "@/components/db/DatabaseError";
import { DB_INIT_MESSAGES, initDatabase, type DbInitError } from "@/lib/db";

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
  return <Stack />;
}
