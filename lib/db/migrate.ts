import type { Db, Migration } from "./types";

export type MigrationErrorKind =
  /** Liste fehlerhaft (Versionen nicht lückenlos ab 1, Name ungültig/doppelt) — Programmierfehler. */
  | "invalid_migrations"
  /** `PRAGMA user_version` konnte nicht gelesen werden. */
  | "version_read_failed"
  /** Gespeicherte Version > höchste bekannte Migration (Downgrade) — nichts geändert. */
  | "newer_than_app"
  /** Eine Migration ist fehlgeschlagen; ihre Transaktion wurde zurückgerollt. */
  | "migration_failed"
  /** Alle Migrationen sind committet, aber Foreign Keys ließen sich nicht wieder einschalten. */
  | "check_failed";

export type MigrationError = {
  kind: MigrationErrorKind;
  /** Technische Meldung (nicht für Nutzer gedacht). */
  message: string;
  /** Name der fehlgeschlagenen Migration (nur bei `migration_failed`). */
  migration?: string;
  cause?: unknown;
};

export type MigrationResult =
  | { data: { from: number; to: number }; error: null }
  | { data: null; error: MigrationError };

const NAME_PATTERN = /^(\d{4})_[a-z]+-\d+_[a-z0-9]+(?:_[a-z0-9]+)*$/;

/** Prüft die Migrationsliste; liefert eine Fehlermeldung oder `null`. */
export function validateMigrations(list: readonly Migration[]): string | null {
  const names = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const expected = i + 1;
    if (m.version !== expected) {
      return `Migration an Position ${expected} hat Version ${m.version}, erwartet ${expected} (lückenlos ab 1)`;
    }
    const match = NAME_PATTERN.exec(m.name);
    if (!match) {
      return `Migration ${m.version} hat ungültigen Namen "${m.name}" (erwartet <NNNN>_<id>_<name>)`;
    }
    if (Number(match[1]) !== m.version) {
      return `Migration ${m.version}: Präfix in "${m.name}" passt nicht zur Version`;
    }
    if (names.has(m.name)) {
      return `Migrationsname "${m.name}" ist doppelt`;
    }
    names.add(m.name);
    if (typeof m.up !== "function") {
      return `Migration ${m.name} hat keinen Schritt`;
    }
  }
  return null;
}

/**
 * PRAGMA-Anweisungen lassen sich in SQLite nicht parametrisieren. Der Wert wird
 * deshalb hier als geprüfte, nicht-negative Ganzzahl interpoliert — er stammt aus
 * der validierten Migrationsliste, nie aus Nutzereingaben.
 */
function userVersionSql(version: number): string {
  if (!Number.isSafeInteger(version) || version < 0) {
    throw new Error(`Ungültige user_version: ${version}`);
  }
  return `PRAGMA user_version = ${version}`;
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/** Schaltet Foreign Keys wieder ein und prüft das; liefert einen Fehler oder `null`. */
async function restoreForeignKeys(db: Db): Promise<MigrationError | null> {
  try {
    await db.exec("PRAGMA foreign_keys = ON");
    const row = await db.getFirst<{ foreign_keys: number }>("PRAGMA foreign_keys");
    if (row?.foreign_keys !== 1) {
      throw new Error("PRAGMA foreign_keys ist nach dem Lauf nicht 1");
    }
    return null;
  } catch (cause) {
    return {
      kind: "check_failed",
      message: `Foreign Keys konnten nicht wieder aktiviert werden: ${messageOf(cause)}`,
      cause,
    };
  }
}

/**
 * Bringt die DB auf den Stand der Liste. Jede fehlende Migration läuft in einer
 * eigenen Transaktion zusammen mit dem Hochsetzen von `user_version`; Stopp bei
 * der ersten fehlerhaften. Bereits erfolgreiche Migrationen davor bleiben bestehen.
 *
 * Stehen Migrationen aus, laufen sie mit `foreign_keys = OFF`; vor jedem COMMIT
 * prüft `PRAGMA foreign_key_check` die Integrität (Verletzung → Rollback,
 * `migration_failed`). Danach wird `foreign_keys = ON` wiederhergestellt und
 * verifiziert — auch im Fehlerfall. Scheitert nur das (alle Migrationen
 * committet), ist das `check_failed`; ein früherer Migrationsfehler hat Vorrang.
 */
export async function runMigrations(db: Db, list: readonly Migration[]): Promise<MigrationResult> {
  const invalid = validateMigrations(list);
  if (invalid) {
    return { data: null, error: { kind: "invalid_migrations", message: invalid } };
  }

  let from: number;
  try {
    const row = await db.getFirst<{ user_version: number }>("PRAGMA user_version");
    from = Number(row?.user_version);
    if (!Number.isSafeInteger(from) || from < 0) {
      throw new Error(`Unerwartete user_version: ${String(row?.user_version)}`);
    }
  } catch (cause) {
    return {
      data: null,
      error: { kind: "version_read_failed", message: messageOf(cause), cause },
    };
  }

  const latest = list.length;
  if (from > latest) {
    return {
      data: null,
      error: {
        kind: "newer_than_app",
        message: `Datenbank-Version ${from} ist neuer als die App (höchste bekannte: ${latest})`,
      },
    };
  }

  if (from === latest) {
    return { data: { from, to: latest }, error: null };
  }

  // Foreign Keys während der Migrationen aus (SQLite-Empfehlung für Schema-
  // Änderungen): Ein Tabellen-Rebuild (neu anlegen → kopieren → DROP alt →
  // umbenennen) würde sonst ON DELETE CASCADE auslösen und Kindzeilen löschen.
  // Das PRAGMA wirkt nur außerhalb einer Transaktion. Die Integrität prüft
  // stattdessen `PRAGMA foreign_key_check` vor jedem COMMIT.
  let failure: MigrationError | null = null;
  try {
    await db.exec("PRAGMA foreign_keys = OFF");
    for (const migration of list) {
      if (migration.version <= from) continue;
      try {
        await db.transaction(async (tx) => {
          await migration.up(tx);
          const violation = await tx.getFirst<{ table: string; parent: string }>(
            'SELECT "table", parent FROM pragma_foreign_key_check LIMIT 1',
          );
          if (violation) {
            throw new Error(
              `Foreign-Key-Verletzung nach der Migration: ${violation.table} → ${violation.parent}`,
            );
          }
          await tx.exec(userVersionSql(migration.version));
        });
      } catch (cause) {
        failure = {
          kind: "migration_failed",
          message: `Migration ${migration.name} fehlgeschlagen: ${messageOf(cause)}`,
          migration: migration.name,
          cause,
        };
        break;
      }
    }
  } catch (cause) {
    failure = {
      kind: "migration_failed",
      message: `Foreign Keys konnten nicht deaktiviert werden: ${messageOf(cause)}`,
      cause,
    };
  } finally {
    const restored = await restoreForeignKeys(db);
    if (restored && !failure) {
      failure = restored;
    }
  }

  if (failure) {
    return { data: null, error: failure };
  }
  return { data: { from, to: latest }, error: null };
}
