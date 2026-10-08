---
paths:
  - "lib/**"
  - "db/**"
---

# Lokale Datenbank (Backend-Modus `lokal`)

> Gilt nur im Backend-Modus **lokal** (siehe `.claude/rules/general.md`, Backend-Modus). Im Modus `supabase` gilt `.claude/rules/backend.md`.

Die App hat keinen Server: Daten liegen in `expo-sqlite` auf dem Gerät. Gesichert wird über das Gerätebackup. Ein verlorener oder beschädigter Datenbestand lässt sich nicht von einem Server zurückholen. Deshalb sind Migrationen hier der heikelste Teil.

## Schema-Migrationen (PFLICHT)
- **Eine** append-only-Liste von Migrationen im Repo (Ort legt die Architektur des Datenbank-Features fest, z. B. `lib/db/migrations.ts`). Sie ist die Quelle der Wahrheit für das Schema
- Versionsstand über `PRAGMA user_version`. Beim App-Start werden alle Migrationen oberhalb der aktuellen Version der Reihe nach ausgeführt, jede in **einer Transaktion** zusammen mit dem Hochsetzen von `user_version`
- **Nie eine ausgelieferte Migration ändern** — nur neue anhängen. Ausgeliefert ist, was in einem Build aus `docs/RELEASES.md` steckt
- Dateiname bzw. Eintrag trägt die Feature-ID (`<NNNN>_<id>_<name>`), damit `git log` und QA sie zuordnen
- Foreign Keys einschalten (`PRAGMA foreign_keys = ON` pro Verbindung), Indizes auf Spalten in WHERE / ORDER BY / JOIN

## Kein Datenverlust beim Update
- Auf dem Gerät läuft nach einem Update **der alte Datenbestand mit dem neuen Code**. Jede Migration muss deshalb mit echten Altdaten funktionieren, nicht nur mit einer leeren DB
- Destruktive Schritte (Tabelle/Spalte entfernen, Typ verengen, NOT NULL ohne Default) **nur nach Bestätigung des Users**. Daten vorher in die neue Struktur kopieren (SQLite: neue Tabelle anlegen → kopieren → alte droppen → umbenennen)
- Schlägt eine Migration fehl, rollt die Transaktion zurück und die App startet mit dem alten Stand plus Fehlermeldung — nie halb migriert

## Data-Access-Layer
- Das Frontend greift nie direkt auf SQLite zu, sondern nur über Funktionen aus `lib/<feature>.ts` (Verträge aus der Spec)
- Jede schreibende Funktion: **Zod-Validierung vor dem DB-Zugriff**; Rückgabe `{ data, error }`, `error` immer prüfen
- Nur Prepared Statements / gebundene Parameter — **nie** Werte per String-Konkatenation in SQL
- `LIMIT` auf jeder Listen-Abfrage; Joins statt N+1
- Mehrere zusammengehörige Schreibvorgänge in einer Transaktion
- Fremd-APIs (z. B. öffentliche Produktdatenbanken): Antwort mit Zod parsen, bevor sie gespeichert wird — fremde Daten sind untrusted input

## Migrations-Test (Ersatz für die Rollback-Probe)
Jest kann `expo-sqlite` nicht nativ ausführen. Die Data-Access-Schicht spricht deshalb gegen eine kleine DB-Schnittstelle; im Test steckt dahinter eine In-Memory-SQLite (z. B. `better-sqlite3`). Die konkrete Wahl trifft die Architektur des Datenbank-Features.

Pflicht-Test (`lib/db/migrations.test.ts` o. ä.), wird von `/backend` erweitert und von `/qa` gefahren:
1. **Frisch:** alle Migrationen von 0 bis aktuell auf leerer DB → erwartete Tabellen/Spalten vorhanden, `user_version` = letzte Migration
2. **Upgrade:** DB auf dem Stand der Vorversion mit Seed-Daten anlegen, neue Migrationen fahren → Daten unverändert vorhanden und lesbar
3. **Idempotenz:** Migrationslauf ein zweites Mal → keine Änderung, kein Fehler

Feature-Tests co-located `lib/<feature>.test.ts`: Happy Path, Validierungsfehler, Grenzfälle aus den **Regeln** der Spec.
