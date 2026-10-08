import type { Migration } from "./types";

/**
 * Append-only Migrationsliste — Quelle der Wahrheit für das Schema.
 *
 * REGEL: Eine ausgelieferte Migration (in einem Build aus docs/RELEASES.md) wird
 * NIE geändert, umsortiert oder entfernt — nur neue werden hinten angehängt.
 * Auf dem Gerät läuft nach einem Update der alte Datenbestand mit dem neuen Code.
 *
 * - `version`: fortlaufend ab 1, lückenlos
 * - `name`: `<NNNN>_<id>_<name>` mit NNNN = version, id = Feature-ID (z. B. `0001_proj-2_foods`)
 * - `up`: Schema-Schritt; läuft in einer eigenen Transaktion zusammen mit dem
 *   Hochsetzen von `PRAGMA user_version`. Destruktive Schritte nur nach Freigabe.
 *
 * Abgesichert durch `lib/db/migrations.test.ts` (Frisch, Upgrade, Idempotenz).
 */
export const migrations: readonly Migration[] = [];
