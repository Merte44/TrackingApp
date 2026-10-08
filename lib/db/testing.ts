/**
 * In-Memory-Implementierung der DB-Schnittstelle über better-sqlite3 — NUR für Jest.
 *
 * Wird bewusst nicht aus `lib/db/index.ts` re-exportiert, damit better-sqlite3
 * (Dev-Dependency, Node-Addon) nie im App-Bundle landet. Import in Tests direkt
 * über `@/lib/db/testing`.
 *
 * Semantik wie expo-sqlite: `run` akzeptiert auch Statements mit Ergebnis
 * (z. B. `INSERT … RETURNING`), `getFirst`/`getAll` auch Statements ohne
 * (Ergebnis `null` bzw. `[]`). better-sqlite3 würde dort sonst werfen.
 */
import Database from "better-sqlite3";

import { createDb } from "./adapter";
import type { Db, SqlParams } from "./types";

export type TestDb = Db;

export function createTestDb(): TestDb {
  const native = new Database(":memory:");
  // WAL ist für In-Memory-DBs wirkungslos; Foreign Keys wie in der App erzwingen.
  native.pragma("foreign_keys = ON");

  const rows = (sql: string, params: SqlParams): unknown[] => {
    const stmt = native.prepare(sql);
    if (stmt.reader) {
      return stmt.all(...params);
    }
    stmt.run(...params);
    return [];
  };

  return createDb(
    {
      run: async (sql, params = []) => {
        const stmt = native.prepare(sql);
        if (!stmt.reader) {
          const result = stmt.run(...params);
          return { changes: result.changes, lastInsertRowId: Number(result.lastInsertRowid) };
        }
        stmt.all(...params);
        // Wie expo-sqlite (sqlite3_changes / last_insert_rowid der Verbindung).
        const meta = native
          .prepare("SELECT changes() AS changes, last_insert_rowid() AS id")
          .get() as { changes: number; id: number | bigint };
        return { changes: meta.changes, lastInsertRowId: Number(meta.id) };
      },
      exec: async (sql) => {
        native.exec(sql);
      },
      getFirst: async <T>(sql: string, params: SqlParams = []) =>
        ((rows(sql, params)[0] as T | undefined) ?? null),
      getAll: async <T>(sql: string, params: SqlParams = []) => rows(sql, params) as T[],
    },
    async () => {
      if (native.open) native.close();
    },
  );
}
