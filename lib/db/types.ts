/**
 * Gemeinsame, asynchrone DB-Schnittstelle (PROJ-1).
 *
 * Alle Features sprechen nur über diese Schnittstelle mit SQLite — nie direkt mit
 * `expo-sqlite`. Implementierungen: `expo.ts` (App) und `testing.ts` (nur Jest).
 *
 * Werte werden ausschließlich als gebundene Parameter (`?`) übergeben, nie per
 * String-Konkatenation in SQL. `exec` nimmt bewusst keine Parameter: Es ist nur
 * für statisches SQL gedacht (Schema-Schritte in Migrationen, Pragmas).
 */

/** Ein bindbarer SQLite-Wert. Booleans als 0/1 speichern. */
export type SqlValue = string | number | null | Uint8Array;

/** Positionale Parameter für `?`-Platzhalter. */
export type SqlParams = readonly SqlValue[];

export type RunResult = {
  /** Anzahl geänderter Zeilen. */
  changes: number;
  /** rowid der zuletzt eingefügten Zeile. */
  lastInsertRowId: number;
};

/** Operationen auf einer Verbindung bzw. innerhalb einer Transaktion. */
export interface DbExecutor {
  /** Ein Statement mit gebundenen Parametern ausführen (INSERT/UPDATE/DELETE …). */
  run(sql: string, params?: SqlParams): Promise<RunResult>;
  /** Statisches SQL ohne Parameter ausführen (auch mehrere Statements). */
  exec(sql: string): Promise<void>;
  /** Erste Ergebniszeile oder `null`. */
  getFirst<T>(sql: string, params?: SqlParams): Promise<T | null>;
  /** Alle Ergebniszeilen. Listen-Abfragen immer mit `LIMIT`. */
  getAll<T>(sql: string, params?: SqlParams): Promise<T[]>;
}

export interface Db extends DbExecutor {
  /**
   * Führt `task` in einer exklusiven Transaktion aus: COMMIT bei Erfolg,
   * ROLLBACK bei geworfenem Fehler (der Fehler wird weitergeworfen).
   *
   * Innerhalb von `task` nur über `tx` zugreifen — ein Aufruf auf der äußeren
   * `Db` wartet, bis die Transaktion beendet ist, und würde sich so selbst blockieren.
   * Transaktionen sind nicht verschachtelbar.
   *
   * Auch nicht awaitete `tx`-Aufrufe werden vor COMMIT abgewartet. Schlägt
   * irgendein `tx`-Aufruf fehl — auch wenn `task` den Fehler abfängt —, wird
   * zurückgerollt und dieser Fehler geworfen.
   */
  transaction<T>(task: (tx: DbExecutor) => Promise<T>): Promise<T>;
  /** Verbindung schließen (nach laufenden Zugriffen). */
  close(): Promise<void>;
}

/** Ein Schema-Schritt in der append-only Migrationsliste (`migrations.ts`). */
export type Migration = {
  /** Fortlaufend ab 1, lückenlos; entspricht danach `PRAGMA user_version`. */
  version: number;
  /** `<NNNN>_<id>_<name>`, z. B. `0001_proj-2_foods`; NNNN = version. */
  name: string;
  /** Schema-Änderung; läuft innerhalb der Transaktion der Migration. */
  up: (tx: DbExecutor) => Promise<void>;
};
