---
name: ops
description: Betriebs-Check für dev und prod — Advisors, Cron-Status, Edge-Function-Logs, Sync-/Job-Logs, hängende Zustände, Migrationsdrift. Als /schedule-Routine nutzbar.
argument-hint: "dev | prod | both (Default both)"
user-invocable: true
---

# Ops-Check

## Rolle
Du prüfst, ob die Umgebungen gesund sind, und meldest Abweichungen — knapp, mit Befund und empfohlener Aktion. Du **änderst nichts** ohne Freigabe; bei prod nie destruktiv.

## Vorher
`docs/ENVIRONMENTS.md` lesen: welche Crons, Edge Functions, Secrets erwartet werden. Nur was dort steht, kann als „fehlt" gemeldet werden.

## Prüfungen (je Umgebung, `mcp__supabase-dev__*` / `mcp__supabase-prod__*`)
1. **Migrationsdrift:** `list_migrations` vs. `ls supabase/migrations/` — fehlt etwas, ist etwas nur remote?
2. **Advisors:** `get_advisors` security + performance — neue Warnungen seit dem letzten Check?
3. **Crons:** `execute_sql` auf `cron.job` und `cron.job_run_details` (letzte Läufe, Status, Dauer) — hängen Jobs, laufen sie zu lange, fehlen erwartete?
4. **Edge Functions:** `list_edge_functions` (Status, Version) + `query_logs` (Fehlerquote, letzte Fehler)
5. **App-eigene Job-Logs:** falls das Projekt eine Log-Tabelle hat (in ENVIRONMENTS benannt) — letzte Läufe, Fehler, hängende Zustände (z. B. Datensätze, die seit Stunden „in Arbeit" sind)
6. **Auth:** `query_logs` auth — auffällige Fehlerhäufungen (Mail-Versand, Rate-Limits)
7. **Secrets-Vollständigkeit:** erwartete Vault-/EF-Secrets laut ENVIRONMENTS vorhanden (Namen prüfen, nie Werte ausgeben)

Ein `execute_sql`-Aufruf pro Frage — mehrere Statements verschlucken frühere Ergebnisse.

## Ausgabe
Pro Umgebung eine kurze Tabelle: Bereich · Status (✅ / ⚠️ / ❌) · Befund · Empfehlung. Danach höchstens drei konkrete nächste Schritte. Kein Fix ohne Freigabe; Fixes laufen über `/backend` (Migration) oder direkt (Cron neu planen) nach Bestätigung.

## Als Routine
`/schedule` mit z. B. wöchentlich `/ops both`; die Routine meldet nur ⚠️/❌. Für Template-Drift zwischen Template und Apps: eigene Routine, Rückführung per `/sync-template`.
