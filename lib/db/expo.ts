import * as SQLite from "expo-sqlite";

import { createDb } from "./adapter";
import type { Db } from "./types";

/**
 * Datei im Standardordner von expo-sqlite (Documents/SQLite) — liegt im
 * iCloud-Gerätebackup und ist die einzige Kopie der Daten.
 */
export const DATABASE_NAME = "tracking.db";

/**
 * Öffnet `tracking.db`, setzt WAL + Foreign Keys und liefert die DB-Schnittstelle.
 *
 * expo-sqlite gibt für denselben Pfad die bereits offene native Verbindung zurück.
 * `fresh: true` (Retry nach Fehlschlag) erzwingt eine neue — die alte ist verworfen,
 * ihr Zustand (Pragmas, offene Transaktion) ungewiss.
 */
export async function openExpoDatabase({ fresh }: { fresh: boolean }): Promise<Db> {
  const native = await SQLite.openDatabaseAsync(DATABASE_NAME, { useNewConnection: fresh });
  try {
    await native.execAsync("PRAGMA journal_mode = WAL;");
    await native.execAsync("PRAGMA foreign_keys = ON;");
    const fk = await native.getFirstAsync<{ foreign_keys: number }>("PRAGMA foreign_keys;");
    if (fk?.foreign_keys !== 1) {
      throw new Error("PRAGMA foreign_keys konnte nicht aktiviert werden");
    }
  } catch (error) {
    // Schließen anstoßen, nicht abwarten — ein hängendes close() hielte sonst den
    // Start (und damit den Splash) für immer fest. Der Retry öffnet ohnehin neu.
    native.closeAsync().catch(() => undefined);
    throw error;
  }

  return createDb({
    run: async (sql, params = []) => {
      const result = await native.runAsync(sql, [...params]);
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowId };
    },
    exec: (sql) => native.execAsync(sql),
    getFirst: <T>(sql: string, params: readonly SQLite.SQLiteBindValue[] = []) =>
      native.getFirstAsync<T>(sql, [...params]),
    getAll: <T>(sql: string, params: readonly SQLite.SQLiteBindValue[] = []) =>
      native.getAllAsync<T>(sql, [...params]),
  }, () => native.closeAsync());
}
