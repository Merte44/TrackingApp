import { openExpoDatabase } from "./expo";
import { runMigrations, type MigrationError } from "./migrate";
import { migrations } from "./migrations";
import type { Db } from "./types";

export { runMigrations, validateMigrations } from "./migrate";
export type { MigrationError, MigrationErrorKind, MigrationResult } from "./migrate";
export type { Db, DbExecutor, Migration, RunResult, SqlParams, SqlValue } from "./types";
// Hinweis: `./testing` (better-sqlite3) wird bewusst NICHT re-exportiert — nur für Jest.

export type DbInitErrorKind = "open_failed" | "migration_failed" | "check_failed" | "newer_than_app";

export type DbInitError = {
  kind: DbInitErrorKind;
  /** Nutzertext (Deutsch) für den Vollbild-Hinweis. */
  message: string;
  /** Technische Details (Migrationsname, Original-Meldung) — klein unter dem Text. */
  detail: string;
  /** Name der fehlgeschlagenen Migration (bei `migration_failed`). */
  migration?: string;
  cause?: unknown;
};

export type InitResult =
  | { data: { version: number }; error: null }
  | { data: null; error: DbInitError };

export const DB_INIT_MESSAGES: Record<DbInitErrorKind, string> = {
  migration_failed:
    "Die Daten konnten nicht auf die neue App-Version umgestellt werden. Deine Daten sind unverändert.",
  check_failed:
    "Die Datenbank ist umgestellt, die abschließende Prüfung ist fehlgeschlagen. Bitte „Erneut versuchen“ oder die App neu starten. Deine Daten sind erhalten.",
  newer_than_app:
    "Die Daten stammen von einer neueren App-Version. Bitte die aktuelle Version installieren.",
  open_failed: "Die Datenbank konnte nicht geöffnet werden.",
};

let db: Db | null = null;
let ready = false;
let readyVersion = 0;
let pending: Promise<InitResult> | null = null;
/** Nach einem Fehlschlag muss der nächste Versuch eine neue native Verbindung öffnen. */
let openFresh = false;

function initError(
  kind: DbInitErrorKind,
  detail: string,
  extra: Pick<DbInitError, "migration" | "cause"> = {},
): InitResult {
  return { data: null, error: { kind, message: DB_INIT_MESSAGES[kind], detail, ...extra } };
}

function fromMigrationError(error: MigrationError): InitResult {
  switch (error.kind) {
    case "newer_than_app":
      return initError("newer_than_app", error.message);
    case "check_failed":
      return initError("check_failed", error.message, { cause: error.cause });
    case "version_read_failed":
      return initError("open_failed", error.message, { cause: error.cause });
    case "invalid_migrations":
    case "migration_failed":
      return initError("migration_failed", error.message, {
        migration: error.migration,
        cause: error.cause,
      });
  }
}

/**
 * Verwirft die Verbindung nach einem Fehlschlag. Das Schließen wird angestoßen,
 * aber nicht abgewartet: Ein hängendes `close()` darf weder diesen Lauf noch den
 * Retry blockieren. Der Retry öffnet eine neue native Verbindung.
 */
function dropConnection(): void {
  const current = db;
  db = null;
  openFresh = true;
  current?.close().catch(() => undefined);
}

async function foreignKeysOn(conn: Db): Promise<boolean> {
  const row = await conn.getFirst<{ foreign_keys: number }>("PRAGMA foreign_keys");
  return row?.foreign_keys === 1;
}

async function doInit(): Promise<InitResult> {
  if (ready && db) {
    return { data: { version: readyVersion }, error: null };
  }
  if (!db) {
    try {
      db = await openExpoDatabase({ fresh: openFresh });
    } catch (cause) {
      openFresh = true;
      return initError("open_failed", cause instanceof Error ? cause.message : String(cause), {
        cause,
      });
    }
  }
  let result: Awaited<ReturnType<typeof runMigrations>>;
  try {
    result = await runMigrations(db, migrations);
  } catch (cause) {
    // runMigrations meldet Fehler als Ergebnis; das hier fängt nur Unerwartetes ab.
    dropConnection();
    return initError("migration_failed", cause instanceof Error ? cause.message : String(cause), {
      cause,
    });
  }
  if (result.error) {
    // Nach jedem Fehlschlag ist der Zustand der Verbindung ungewiss (Pragmas, offene
    // Transaktion) — verwerfen, damit ein Retry frisch öffnet und die Pragmas neu setzt.
    dropConnection();
    return fromMigrationError(result.error);
  }
  // Abschlussprüfung in JEDEM Lauf — auch wenn keine Migration ausstand: Erfolg nur
  // auf einer Verbindung, deren Foreign Keys nachweislich an sind.
  let fkOn = false;
  let fkCause: unknown;
  try {
    fkOn = await foreignKeysOn(db);
  } catch (cause) {
    fkCause = cause;
  }
  if (!fkOn) {
    dropConnection();
    const detail =
      fkCause === undefined
        ? "PRAGMA foreign_keys ist nach dem Lauf nicht 1"
        : fkCause instanceof Error
          ? fkCause.message
          : String(fkCause);
    return initError("check_failed", detail, { cause: fkCause });
  }
  ready = true;
  openFresh = false;
  readyVersion = result.data.to;
  return { data: { version: readyVersion }, error: null };
}

/**
 * Öffnet die DB (falls nötig) und fährt die Migrationen. Mehrfach aufrufbar
 * (Retry nach Fehler); gleichzeitige Aufrufe teilen sich einen Lauf; ist die DB
 * bereits bereit, passiert nichts.
 */
export function initDatabase(): Promise<InitResult> {
  if (!pending) {
    pending = doInit().finally(() => {
      pending = null;
    });
  }
  return pending;
}

/** Die geöffnete, migrierte DB. Wirft vor erfolgreichem `initDatabase()` (Programmierfehler). */
export function getDb(): Db {
  if (!ready || !db) {
    throw new Error("Datenbank ist nicht initialisiert — initDatabase() muss zuerst erfolgreich laufen");
  }
  return db;
}

/** Nur für Jest: Verbindung ersetzen (z. B. `createTestDb()`), `null` setzt zurück. */
export function setDbForTesting(testDb: Db | null): void {
  db = testDb;
  ready = testDb !== null;
  readyVersion = 0;
  pending = null;
  openFresh = false;
}
