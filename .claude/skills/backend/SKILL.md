---
name: backend
description: Datenschicht eines Features. Modus supabase — Migration, RLS, RPCs/Edge Functions, lib/-Data-Access, Jest + Rollback-Probe, dev → prod-Freigabe. Modus lokal — SQLite-Migration, lib/-Data-Access, Jest + Migrations-Test. Parallel zu /frontend möglich.
argument-hint: "<ID> [--auto]"
user-invocable: true
---

# Backend

## Modus zuerst
Backend-Modus aus `CLAUDE.md` bestimmen (`.claude/rules/general.md`, Backend-Modus). **Modus lokal → nur Abschnitt „Modus lokal" unten**, die übrigen Abschnitte gelten für Modus supabase.

**`--auto`** (Aufruf aus `/autopilot`): eigene Rückfragen entfallen nach der Tabelle *Abweichungen der Skills bei `--auto`* in `.claude/skills/autopilot/SKILL.md`; harte Stopps dort gelten weiter.

## Modus lokal (expo-sqlite)
Regeln: `.claude/rules/local-db.md`. Kein Server, kein MCP, kein prod.
1. **Lesen:** INDEX, Spec (**Plan** — Backend-Aufgaben, **Daten & Server** inkl. **Verträge**, **Regeln**), bestehende Migrationsliste und `lib/`
2. **Klären (kurz):** nur Offenes — Grenzwerte, Verhalten bei Altdaten, destruktive Schritte. Eine Frage, mit Empfehlung
3. **Aufgaben abarbeiten:** Aufgaben der Ebene Backend aus `## Plan` der Reihe nach (Regeln: `features/README.md` → Plan). Pro Aufgabe:
   - **Backend-Agent (`.claude/agents/backend-dev.md`)** per Agent-Tool mit **genau dieser Aufgabe** starten — frischer Kontext pro Aufgabe. Auftrag: Spec-Pfad, Aufgaben-ID, Modus lokal, freigegebene Entscheidungen. Sehr kleine Aufgabe oder noch in Klärung → inline
   - Prüfen (`npm test` inkl. Migrations-Test, `npx tsc --noEmit`); dann Status `erledigt <commit>` in der Tabelle und **ein Commit pro Aufgabe**: `feat(<ID>): T<n> <Aufgabe>` — sicherer Haltepunkt
   - Jeder neue AC-Test hat einen **Rot-Nachweis** im Agent-Ergebnis (Agent → „Test zuerst"); fehlt er, nachfordern — der Test könnte grün sein, ohne etwas zu prüfen
   - Unabhängige Aufgaben (keine Abhängigkeit, keine gemeinsamen Dateien) dürfen parallel laufen
   - Merkt der Agent, dass die Aufgabe nicht zur Spec passt → Stopp und an den User, nie die Spec still anpassen

   Das **Diff-Review mit dem User** bleibt am Ende der Phase, über alle Aufgaben-Commits (`git diff <vor T-erste>..HEAD`). Spec ohne `## Plan` (älter angelegt): die Phase als ein Auftrag wie bisher.
4. **Prüfen:** `npm test` (Migrations-Test grün: frisch, Upgrade, Idempotenz) und `npx tsc --noEmit`. Jede AC mit Logik in `lib/` oder der Migration hat mindestens einen Test, der ihre ID im Namen trägt (`features/README.md` → Nachverfolgbarkeit). Diff mit dem User reviewen; destruktive Schritte nur nach Bestätigung
5. **Abschluss:** `/code-review` über den Diff; Spec **Verlauf**-Zeile („Backend gebaut: Migration NNNN, Migrations-Test grün"); INDEX → In Progress (Write-Then-Verify). `docs/ENVIRONMENTS.md` nur, wenn das Feature wirklich Per-Env-Bedarf hat (z. B. API-Key)
6. **Context Recovery:** erste offene Backend-Aufgabe in `## Plan`; dazu `git diff` + Migrationsliste

Handoff und Commit wie unten.

## Rolle (Modus supabase)
Du bist Backend-Entwickler. Supabase **ist** das Backend: Schema + RLS im Projekt, Edge Functions für Server-Logik, `lib/<feature>.ts` als Data-Access für das Frontend. Es gibt keine API-Routen im Repo.

## Vor dem Start
1. `features/INDEX.md`, Spec lesen — **Daten & Server** inkl. **Verträge**, **Regeln**, **Umgebung**
2. Bestand: `ls lib/ supabase/migrations/ supabase/tests/`; Schema: `mcp__supabase-dev__list_tables`; `lib/supabase.ts` (secure-store-Adapter) vorhanden?
3. `docs/ENVIRONMENTS.md` lesen — was ist auf dev/prod schon eingerichtet?

## Workflow

### 1. Klären (kurz)
Nur Offenes: Rechte (owner-only / geteilt), gleichzeitige Änderungen, Server-only-Teile (Edge Function), Validierungsgrenzen. Eine Frage, mit Empfehlung.

### 2. Migration schreiben und auf dev anwenden
- Datei `supabase/migrations/<NNNN>_<proj-x>_<name>.sql` (Quelle der Wahrheit), dann `mcp__supabase-dev__apply_migration`
- RLS auf jeder Tabelle, Policies nur für benötigte Operationen, Indizes, FKs; DEFINER-Funktionen mit gepinntem `search_path`, `anon` revoken
- `mcp__supabase-dev__get_advisors` (security + performance): keine neue Warnung

### 3. Rollback-Probe (Pflicht bei RPC/RLS/Trigger)
`supabase/tests/<proj-x>_<name>.sql` nach dem Muster in `.claude/rules/backend.md`: seedet, impersoniert, assertet, rollt per `RAISE EXCEPTION 'REGRESSION_PASS …'` zurück. Per `mcp__supabase-dev__execute_sql` fahren; Ergebnis muss `REGRESSION_PASS` sein. Das ist der Beweis, den Jest nicht liefern kann.

### 4. Data-Access + Tests
- `lib/<feature>.ts` **exakt nach den Verträgen** der Spec: Zod vor jedem Call, `{ data, error }`, `.limit()` auf Listen; Frontend-Stubs (`TODO(<ID>): backend`) ersetzen
- Edge Functions in `supabase/functions/<name>/`; Secrets pro Umgebung setzen und in `docs/ENVIRONMENTS.md` eintragen
- Jest co-located `lib/<feature>.test.ts`: Happy Path, Validierungsfehler, keine Session; Supabase-Client gemockt. Testnamen tragen die AC-IDs (`it("AC-2: …")`, `features/README.md` → Nachverfolgbarkeit). `npm test`, `npx tsc --noEmit`

### 5. Aufgaben abarbeiten
Aufgaben der Ebene Backend aus `## Plan` der Reihe nach (Regeln: `features/README.md` → Plan). Pro Aufgabe:
- **Backend-Agent (`.claude/agents/backend-dev.md`, hat `mcp__supabase-dev__*`, nie prod)** per Agent-Tool mit **genau dieser Aufgabe** starten — frischer Kontext pro Aufgabe. Auftrag: Spec-Pfad, Aufgaben-ID, Modus supabase, freigegebene Entscheidungen. Sehr kleine Aufgabe oder noch in Klärung → inline
- Prüfen (`npm test`, `npx tsc --noEmit`, Probe `REGRESSION_PASS`, Advisors clean); dann Status `erledigt <commit>` in der Tabelle und **ein Commit pro Aufgabe**: `feat(<ID>): T<n> <Aufgabe>` — sicherer Haltepunkt
- Jeder neue AC-Test hat einen **Rot-Nachweis** im Agent-Ergebnis (Agent → „Test zuerst"); fehlt er, nachfordern — der Test könnte grün sein, ohne etwas zu prüfen
- Unabhängige Aufgaben (keine Abhängigkeit, keine gemeinsamen Dateien) dürfen parallel laufen
- Merkt der Agent, dass die Aufgabe nicht zur Spec passt → Stopp und an den User, nie die Spec still anpassen

Das **Diff-Review mit dem User** bleibt am Ende der Phase, über alle Aufgaben-Commits (`git diff <vor T-erste>..HEAD`). Spec ohne `## Plan` (älter angelegt): die Phase als ein Auftrag wie bisher. Produktentscheidungen und destruktive Ops bleiben interaktiv.

### 6. Umgebung
Braucht das Feature Vault-Secrets, EF-Secrets, Crons, Auth-Templates, SMTP, Push: in `docs/ENVIRONMENTS.md` eintragen (Name, Fundort, dev ☑ / prod ☐). Was auf prod fehlt, ist die Vorbereitungsliste für `/deploy`.

### 7. prod
Nicht Teil dieses Laufs. prod-Anwendung geschieht in `/deploy` (gebatcht mit dem Build) — außer der User gibt sie ausdrücklich jetzt frei: dann `/security-review` bei DEFINER/RLS/Edge Function, `mcp__supabase-prod__apply_migration`, Advisors, `list_migrations` gegen Repo. Destruktive Ops auf prod immer bestätigen lassen.

### 8. Abschluss
- `/code-review` über den Diff; Findings beheben
- Spec: **Verlauf**-Zeile („Backend gebaut: Migration NNNN, Probe grün, Advisors clean")
- INDEX: Status → In Progress (Write-Then-Verify)

## Context Recovery
Erste offene Backend-Aufgabe in `## Plan`; dazu `git diff` + `mcp__supabase-dev__list_migrations`.

## Handoff
„Backend steht auf dev. Nächster Schritt: `/qa <ID>`." (Frontend noch offen: „… zuerst `/frontend <ID>`.")

## Commit
```
feat(<ID>): T<n> <Aufgabe>                      # je Aufgabe
feat(<ID>): Implement backend for [feature]     # Abschluss: Review-Fixes, Verlauf, INDEX
```
