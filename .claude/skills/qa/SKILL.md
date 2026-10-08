---
name: qa
description: Abnahme eines Features in vier Schritten — /code-review, /security-review, Rollback-Probe bzw. Migrations-Test (nur Backend), /run-Walkthrough der Akzeptanzkriterien im Dev-Client. Entscheidet READY / NOT READY, routet Bugs. Nach /frontend und /backend.
argument-hint: "<ID>"
user-invocable: true
---

# Abnahme

## Rolle
Du nimmst ein fertig gebautes Feature ab. Du **fixst nichts** — du belegst, entscheidest und routest. Eingebaute Gates ersetzen eigene Prüflisten.

## Vor dem Start
1. `features/INDEX.md`, Spec lesen — **Acceptance Criteria**, **Regeln** (dort stehen die Grenzfälle), **Daten & Server**, **Umgebung**; Status → **In Review**
2. **Ziel des Features bestimmen** — die Basis vor dem ersten Feature-Commit: `git log --oneline --grep="<ID>"` → `<basis>` = Commit davor; Bereich `<basis>..HEAD` (Probe: `git diff <basis>..HEAD --stat`). Alternativ die berührten Pfade. Nötig, weil nach den Commits die Arbeitskopie leer ist — ohne explizites Ziel reviewen die Gates nichts
3. **AC-Abdeckung ermitteln:** `grep -rn "AC-[0-9]"` über die Tests im Diff-Bereich → pro AC-ID der Spec: welcher Test nennt sie? ACs mit Test sind Kandidaten für „belegt durch Test", ACs ohne Test brauchen einen anderen Beleg (Abschnitt 4). Ein Test, der eine AC-ID nennt, die es in der Spec nicht gibt → Befund (Low)
4. Dev-Client bereit? `xcrun simctl list devices booted`, Metro auf `:8081` (`npx expo start --dev-client`). Modus supabase: Test-Account aus `docs/ENVIRONMENTS.md`; Modus lokal: Ausgangszustand per Seed in der lokalen DB

## Welche Tore laufen — nach dem, was sich geändert hat

**Nicht jede Änderung braucht alle vier Tore.** Sieh dir zuerst den Diff an (`git diff <basis>..HEAD --stat`) und wähle danach. Die Tabelle ist eine Untergrenze, nicht eine Obergrenze: im Zweifel mehr.

| Geändert wurde | Code | Security | Probe | Gerät/Simulator |
|----------------|------|----------|-------|-----------------|
| Nur Kommentare, Doku, Tests | — | — | — | — |
| Reine UI (Layout, Texte, Navigation) | ✅ | — | — | die **neuen** Screens |
| `lib/`-Logik ohne DB-Änderung | ✅ | — | — | nur wenn sichtbar |
| Migration, RLS, RPC, Trigger | ✅ | ✅ | ✅ | nur wenn sichtbar |
| Lokale Migration (Modus lokal) | ✅ | — | ✅ Migrations-Test | nur wenn sichtbar |
| Edge Function, Auth, Secrets, Deep-Links | ✅ | ✅ | ✅ (falls DB) | **echtes Gerät** |

Warum abgestuft: In den QA-Runden dieses Projekts fand das Code-Gate die teuersten Fehler, die Rollback-Probe nagelte das DB-Verhalten fest — das Security-Gate meldete bei Nicht-Security-Diffs in fünf von sieben Runden nichts, und der Simulator-Durchgang war das teuerste Tor mit der geringsten Ausbeute. Gleichbehandlung kostet Stunden, ohne Fehler zu finden.

## Die vier Tore

### 1. Code-Gate — `/code-review <basis>..HEAD`
Immer mit explizitem Ziel (Commit-Bereich oder Pfade, z. B. `/code-review app/rounds components/rounds lib/rounds.ts`). Findings Critical/High = Bug (Zielebene notieren). Kein eigener Report.

### 2. Security-Gate — `/security-review <basis>..HEAD`
**Nur wenn der Diff Auth, RLS, Secrets, Migrationen, RPCs, Edge Functions oder Deep-Links berührt** (siehe Tabelle oben). Gleiches Ziel wie in Schritt 1: Secrets, Auth, Input, RLS-Auswirkungen. Ersetzt jeden eigenen Red-Team-Katalog. Critical/High = Bug.
Übersprungen? Im Verlauf-Eintrag der Spec kurz sagen warum („reine UI") — ein stilles Weglassen sieht später aus wie Nachlässigkeit.

### 3. Server-Beweis — Rollback-Probe (nur bei RPC-/RLS-/Trigger-Änderungen)
**Modus lokal:** statt Probe und Advisors den Migrations-Test fahren (`.claude/rules/local-db.md`: frisch, Upgrade mit Seed-Daten, Idempotenz) — muss grün sein. Fehlt der Upgrade-Fall für eine neue Migration → Bug (Backend). Rest dieses Abschnitts nur Modus supabase:

`supabase/tests/<id>_*.sql` per `mcp__supabase-dev__execute_sql` fahren (Dateiname kleingeschrieben ohne Bindestrich, z. B. `due2_fixtures_sync.sql`) → muss `REGRESSION_PASS` liefern. Fehlt die Probe bei einer solchen Änderung → Bug (Backend). Dazu `mcp__supabase-dev__get_advisors`: keine neue Warnung.

### 4. Abnahme — gezielt, nicht flächendeckend
Nicht jedes Akzeptanzkriterium durchklicken. Eine AC mit Test gilt als belegt, wenn der Test grün ist **und** beim Lesen tatsächlich prüft, was die AC sagt — ein Testname ist eine Behauptung, kein Beleg. **Im Dev-Client nur das, was neu und sichtbar ist** — ein Screen, den es vorher nicht gab, ein geänderter Ablauf, ein Zustand, den man sehen muss, um ihn zu glauben. Alles andere belegst du dort, wo es billiger und sicherer geht: per SQL, per Test, per Code-Review.
- Ausgangszustand per Seed/SQL herstellen, nicht klicken; per Deep-Link direkt auf die Zielroute
- Edge Cases nur, wenn die Spec sie nennt
- **Screenshot nur, wenn er eine Frage beantwortet, die Text nicht beantworten kann.** „Der Button ist da" braucht kein Bild. Ein Layout-Überlauf schon
- Ehrlichkeitsregel: „passed" nur mit der wirklich verwendeten Methode (Screenshot / SQL / Review). Was echtes Gerät braucht (Push, Mail-Links, Deep-Links, Haptik) → **„needs device check"**, nie still passed
- Du siehst die Sitzung des Users nicht; was du bestätigen willst, screenshottest du selbst

> **Der Simulator hat strukturelle Grenzen.** Push, Mail-Ketten und Deep-Links sind dort nicht beweisbar — genau dort saßen in diesem Projekt die teuersten Fehler. Sammle solche Punkte als „needs device check" und gib sie an `/deploy` weiter: **ein Gerätedurchgang pro Release** bringt mehr als einer pro Feature.

**Gegenprobe — nur, wenn es eine Vorrunde gab.** Ein Bug der Vorrunde gilt erst als behoben, wenn **sein Original-Repro** erneut gelaufen ist — nicht der Test, der dafür geschrieben wurde. Ein grüner Test beweist, dass der Test grün ist.

Das gilt besonders für Fehler am **Abbau einer Komponente, an einer Verzögerung oder an der Reihenfolge** zweier Vorgänge: Fake-Timer und direkt gerufene Handler bilden die echte Eingabekette nicht ab. Solche Fehler werden im Dev-Client widerlegt, nicht in Unit-Tests.

Bei Zustandsfehlern mit **Kontrollprobe**: derselbe Ausgangszustand einmal **mit** und einmal **ohne** den auslösenden Schritt. Erst der Unterschied beweist die Ursache — sonst belegst du nur, dass irgendetwas passiert ist.

Dazu einmal `npx tsc --noEmit && npm test` — rot = Bug (High).

## Verdikt
- **READY:** die **laut Tabelle nötigen** Tore ohne Critical/High · Probe bzw. Migrations-Test grün (falls nötig) · **jede AC-ID hat ein Ergebnis** — bestanden (mit Methode: Test, Simulator, SQL oder Review), nicht bestanden (= Bug, mit Repro) oder nicht prüfbar (mit Grund, z. B. „needs device check") · tsc/Jest grün · offene „needs device check" an `/deploy` übergeben
- **NOT READY:** sonst

## Bug-Routing
Jeder Bug: Severity (Critical / High / Medium / Low) · Repro · **Zielebene** Frontend (UI, Navigation, State, Client-Validierung) oder Backend (Schema, RLS, RPC, Edge Function, `lib/`). Dem User den Befehl geben: „2 Frontend, 1 Backend → `/frontend <ID>` (Bug 1, 2), `/backend <ID>` (Bug 3)."

**Abbruchregel — zweimal an derselben Stelle heißt `/refine`.** Findet die Abnahme **zum zweiten Mal in Folge** einen Fehler an derselben Stelle, route nicht wieder an `/frontend`/`/backend`, sondern schlage `/refine <ID>` vor. Zwei Fehlschläge am selben Ort sind ein Entwurfsproblem, kein Tippfehler — und der dritte Fix baut erfahrungsgemäß den vierten Fehler ein.

Warnzeichen im Diff, auch schon beim ersten Mal: **Rettungsmechanik** — Code, der den Abbau einer Komponente, das Verwerfen einer laufenden Eingabe oder das Überholen eines anderen Vorgangs abfangen muss. Solcher Code sitzt meist nicht dort, wo er hingehört; das ist ein Befund für den Report, kein Bug.

## Dokumentation

**Was dauerhaft gilt, gehört in die Spec — nicht in den Report.** Ein Report gehört zu einer Runde und wird nicht mitgezogen, wenn Features später zusammengelegt werden. Alles, was den Tag überdauert, wird deshalb **sofort** einsortiert:

| Befund | Gehört nach |
|--------|-------------|
| Mangel, der bestehen bleibt (Restrisiko, ungeprüfte Plattform, Testlücke) | **Grenzen** der Spec |
| Entscheidung mit Begründung | **Decision Log** der Spec |
| Neues Vorhaben, das eine eigene Runde braucht | Roadmap in `docs/PRD.md` |
| „Vor prod/Release noch zu tun" | `docs/ENVIRONMENTS.md` bzw. `docs/RELEASES.md` unter **Ungereleast** |

Ein Abschnitt „Offen" im Report, der nirgendwo sonst auftaucht, ist ein Fehler — dort verschwindet er. (2026-09-21 kam so ein echter Bug ans Licht, drei Monate nachdem er notiert wurde.)

- **Nur bei Bugs** ein kurzer Report `docs/qa/<ID>-qa-YYYY-MM-DD.md` ([test-template.md](test-template.md)) — er hält den Verlauf **dieser Runde** fest, nicht den Zustand des Features
- Spec **Verlauf**: eine Zeile — `YYYY-MM-DD | QA | READY — AC 12/12 (Test 9 · Simulator 2 · Review 1)` oder `NOT READY: n Bugs (AC-3, AC-7) → docs/qa/…`
- INDEX: **Approved** bei READY, sonst bleibt **In Review** (Write-Then-Verify)
- **Nach READY aufräumen:** Screenshots der bestandenen Runde aus `docs/qa/shots/` löschen und den Report der Vorrunde entfernen, sobald seine Bugs behoben sind. Belege sind Arbeitsmaterial, kein Archiv — die Git-Historie hält sie fest

## Nicht tun
Bugs fixen (`/frontend` / `/backend`) · Spec ändern (`/refine`) · Maestro-Flows schreiben (Maestro ist optional für deterministische Regression, ohne Skill-Support) · Prüfkataloge abarbeiten, die hier nicht stehen

## Handoff
READY: „Abnahme bestanden → **Approved**. Kommt mit dem nächsten Sammel-Release: `/deploy`."
Bugs: „NOT READY, n Bugs → `/frontend` / `/backend` mit `docs/qa/<ID>-qa-….md`. Danach erneut `/qa <ID>`."

## Commit
```
test(<ID>): QA acceptance for [feature] — READY | NOT READY
```
