---
name: frontend
description: UI eines Features bauen — Expo Router, NativeWind, reusables-Primitives + eigene Kompositionen, aus der Screen-Datei des Features. Nach /architecture; parallel zu /backend möglich.
argument-hint: "<ID> [--auto]"
user-invocable: true
---

# Frontend

## Rolle
Du bist Frontend-Entwickler. Du baust die UI aus Spec + Screen-Datei. Design-Entscheidungen, die die Spec nicht trifft, klärst du mit dem User — dann wird ausgeführt.

**`--auto`** (Aufruf aus `/buildchef`): eigene Rückfragen entfallen nach der Tabelle *Abweichungen der Skills bei `--auto`* in `.claude/skills/buildchef/SKILL.md`; harte Stopps dort gelten weiter.

## Vor dem Start
1. `features/INDEX.md`, Spec lesen — **Plan** (Frontend-Aufgaben), **Screens & Komponenten**, die **Verträge** unter **Daten & Server**, **Regeln** (Fehler-/Leerzustände), **Design**
2. `docs/design-system.md` lesen (Look) · **nur** `docs/design/screens/<ID>.html` lesen (Layout) — nie `docs/design/mockup.html`
3. Bestand: `ls components/ui/` · `git ls-files components/ hooks/ app/`
4. Fehlt die Screen-Datei bei einem UI-Feature → erst `/design screen <ID>` (oder aus dem Mockup herauslösen), dann weiter

## Workflow

### 1. Klären (kurz)
Nur was Spec und Screen-Datei offen lassen: Interaktionen (Gesten, Haptik), Offline-Verhalten, Navigation. Eine Frage auf einmal, mit Empfehlung.

### 2. Bauen
- Primitives aus `components/ui/`; fehlende installieren: `npx @react-native-reusables/cli@latest add <name>`
- Kompositionen nach `components/<domain>/`; Screens nach `app/` (Expo Router)
- Data-Access nur über die **Verträge** aus der Spec (`lib/<feature>.ts`). Läuft `/backend` parallel oder später: Funktionen mit Signatur laut Vertrag und `TODO(<ID>): backend` als Stub anlegen — der Backend-Lauf füllt sie
- Loading / Error / Empty; SafeAreaView, KeyboardAvoidingView, FlatList; Accessibility-Props; Tokens, nie Hex (`.claude/rules/frontend.md`)

### 3. Aufgaben abarbeiten
Aufgaben der Ebene Frontend aus `## Plan` der Reihe nach (Regeln: `features/README.md` → Plan). Pro Aufgabe:
- **Frontend-Agent (`.claude/agents/frontend-dev.md`)** per Agent-Tool mit `isolation: "worktree"` mit **genau dieser Aufgabe** starten — frischer Kontext pro Aufgabe. Auftrag: Spec-Pfad, Aufgaben-ID, Screen-Datei, Verträge, Zielordner, freigegebene Entscheidungen. Sehr kleine Aufgabe oder noch in Klärung → inline
- Prüfen (`npx tsc --noEmit && npm run lint && npm test`); dann Status `erledigt <commit>` in der Tabelle und **ein Commit pro Aufgabe**: `feat(<ID>): T<n> <Aufgabe>` — sicherer Haltepunkt
- Jeder neue AC-Test hat einen **Rot-Nachweis** im Agent-Ergebnis (Agent → „Test zuerst"); fehlt er, nachfordern — der Test könnte grün sein, ohne etwas zu prüfen
- Unabhängige Aufgaben (keine Abhängigkeit, keine gemeinsamen Dateien) dürfen parallel laufen
- Merkt der Agent, dass die Aufgabe nicht zur Spec passt → Stopp und an den User, nie die Spec still anpassen

Das **Diff-Review mit dem User** bleibt am Ende der Phase, über alle Aufgaben-Commits (`git diff <vor T-erste>..HEAD`). Spec ohne `## Plan` (älter angelegt): die Phase als ein Auftrag wie bisher.

### 4. Prüfen
```bash
npx tsc --noEmit && npm run lint && npm test
```
Tests nennen die AC-IDs, die sie belegen (`it("AC-4: …")`, `features/README.md` → Nachverfolgbarkeit). ACs, die nur sichtbar zu belegen sind (Layout, Gesten), brauchen keinen Test — sie gehen an `/qa`.
Dann `/run` (Dev-Client im Simulator): jeden Screen einmal öffnen, Screenshot. Feedback einarbeiten; iPad/Android sind Follow-up.

### 5. Abschluss
- `/code-review` über den Diff; Findings beheben
- Spec: **Verlauf**-Zeile („Frontend gebaut: <Screens>"), Abweichungen vom Design notieren
- INDEX: Status → In Progress (Write-Then-Verify)

## Context Recovery
Spec + INDEX erneut lesen — die **erste offene Frontend-Aufgabe** in `## Plan` ist der Wiedereinstieg; `git diff` für Halbfertiges. Nichts doppelt bauen.

## Handoff
Backend nötig und noch nicht gebaut: „Frontend steht (Stubs laut Vertrag). Nächster Schritt: `/backend <ID>`."
Sonst: „Frontend steht. Nächster Schritt: `/qa <ID>`."

## Commit
```
feat(<ID>): T<n> <Aufgabe>                      # je Aufgabe
feat(<ID>): Implement frontend for [feature]     # Abschluss: Review-Fixes, Verlauf, INDEX
```
