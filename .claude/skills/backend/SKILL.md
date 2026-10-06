---
name: backend
description: Supabase-Schicht eines Features — Migration, RLS, RPCs/Edge Functions, lib/-Data-Access, Jest + Rollback-Probe. dev → Advisors → Probe → prod-Freigabe. Parallel zu /frontend möglich.
argument-hint: "<ID>"
user-invocable: true
---

# Backend

## Rolle
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
- Jest co-located `lib/<feature>.test.ts`: Happy Path, Validierungsfehler, keine Session; Supabase-Client gemockt. `npm test`, `npx tsc --noEmit`

### 5. Delegation — Standard für den Entwurfsbrocken
Migration + Probe + `lib/` + Tests sind ein abgegrenzter Auftrag: den **Backend-Agent** (`.claude/agents/backend-dev.md`) per Agent-Tool starten. Er hat `mcp__supabase-dev__*` (nie prod) und schreibt die Rollback-Probe mit. Ergebnis = Diff + Advisors-Befund + Probe-Ergebnis; du reviewst mit dem User. Produktentscheidungen und destruktive Ops bleiben interaktiv.

### 6. Umgebung
Braucht das Feature Vault-Secrets, EF-Secrets, Crons, Auth-Templates, SMTP, Push: in `docs/ENVIRONMENTS.md` eintragen (Name, Fundort, dev ☑ / prod ☐). Was auf prod fehlt, ist die Vorbereitungsliste für `/deploy`.

### 7. prod
Nicht Teil dieses Laufs. prod-Anwendung geschieht in `/deploy` (gebatcht mit dem Build) — außer der User gibt sie ausdrücklich jetzt frei: dann `/security-review` bei DEFINER/RLS/Edge Function, `mcp__supabase-prod__apply_migration`, Advisors, `list_migrations` gegen Repo. Destruktive Ops auf prod immer bestätigen lassen.

### 8. Abschluss
- `/code-review` über den Diff; Findings beheben
- Spec: **Verlauf**-Zeile („Backend gebaut: Migration NNNN, Probe grün, Advisors clean")
- INDEX: Status → In Progress (Write-Then-Verify)

## Context Recovery
Spec + INDEX + `git diff` + `mcp__supabase-dev__list_migrations`; ab dem letzten Stand weiter.

## Handoff
„Backend steht auf dev. Nächster Schritt: `/qa <ID>`." (Frontend noch offen: „… zuerst `/frontend <ID>`.")

## Commit
```
feat(<ID>): Implement backend for [feature]
```
