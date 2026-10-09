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
export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: "0001_proj-2_foods",
    // Eigene Lebensmittel (PROJ-2). Neue Tabelle, nicht destruktiv.
    // - id AUTOINCREMENT: gelöschte ids werden nie neu vergeben — eine veraltete
    //   id (offenes Bearbeiten-Sheet, spätere Verweise) trifft nie ein anderes Lebensmittel.
    // - name_key: normalisierter Name (klein, ohne Umlaute/Akzente), gesetzt von lib/foods.ts.
    // - CHECKs sind die zweite Sicherung hinter Zod (gleiche Grenzen wie in der Spec).
    // - barcode: leere Barcodes speichert die Datenschicht als NULL; '' wird abgelehnt.
    // - Zeitstempel: INTEGER, Unix-Millisekunden (wie Date.now()); Default per
    //   julianday, da unixepoch('subsec') erst ab SQLite 3.42 existiert.
    up: async (tx) => {
      await tx.exec(`
        CREATE TABLE foods (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        TEXT    NOT NULL CHECK (trim(name) <> ''),
          name_key    TEXT    NOT NULL,
          kcal        REAL    NOT NULL CHECK (kcal BETWEEN 0 AND 900),
          carbs       REAL    NOT NULL CHECK (carbs BETWEEN 0 AND 100),
          fat         REAL    NOT NULL CHECK (fat BETWEEN 0 AND 100),
          protein     REAL    NOT NULL CHECK (protein BETWEEN 0 AND 100),
          piece_grams REAL    CHECK (piece_grams IS NULL OR piece_grams > 0),
          barcode     TEXT    CHECK (
                                barcode IS NULL
                                OR (length(barcode) BETWEEN 8 AND 14 AND barcode NOT GLOB '*[^0-9]*')
                              ),
          created_at  INTEGER NOT NULL
                      DEFAULT (CAST(round((julianday('now') - 2440587.5) * 86400000) AS INTEGER)),
          updated_at  INTEGER NOT NULL
                      DEFAULT (CAST(round((julianday('now') - 2440587.5) * 86400000) AS INTEGER)),
          CHECK (round(carbs + fat + protein, 6) <= 100)
        );
        CREATE INDEX foods_name_key_idx ON foods (name_key);
        CREATE UNIQUE INDEX foods_barcode_uidx ON foods (barcode) WHERE barcode IS NOT NULL;
      `);
    },
  },
];
