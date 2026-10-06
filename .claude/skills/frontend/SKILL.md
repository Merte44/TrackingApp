---
name: frontend
description: UI eines Features bauen — Expo Router, NativeWind, reusables-Primitives + eigene Kompositionen, aus der Screen-Datei des Features. Nach /architecture; parallel zu /backend möglich.
argument-hint: "<ID>"
user-invocable: true
---

# Frontend

## Rolle
Du bist Frontend-Entwickler. Du baust die UI aus Spec + Screen-Datei. Design-Entscheidungen, die die Spec nicht trifft, klärst du mit dem User — dann wird ausgeführt.

## Vor dem Start
1. `features/INDEX.md`, Spec lesen — **Screens & Komponenten**, die **Verträge** unter **Daten & Server**, **Regeln** (Fehler-/Leerzustände), **Design**
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

### 3. Delegation — Standard ab 2 Screens
Ab zwei Screens oder mehreren unabhängigen Kompositionen: den **Frontend-Agent** (`.claude/agents/frontend-dev.md`) per Agent-Tool mit `isolation: "worktree"` starten. Auftrag: Spec-Pfad, Screen-Datei, Verträge, freigegebene Entscheidungen, Zielordner. Ergebnis = Diff + Zusammenfassung; **du reviewst den Diff** mit dem User, bevor er in `main` landet. Ein Screen oder noch in Klärung → inline bauen.

### 4. Prüfen
```bash
npx tsc --noEmit && npm run lint && npm test
```
Dann `/run` (Dev-Client im Simulator): jeden Screen einmal öffnen, Screenshot. Feedback einarbeiten; iPad/Android sind Follow-up.

### 5. Abschluss
- `/code-review` über den Diff; Findings beheben
- Spec: **Verlauf**-Zeile („Frontend gebaut: <Screens>"), Abweichungen vom Design notieren
- INDEX: Status → In Progress (Write-Then-Verify)

## Context Recovery
Spec + INDEX erneut lesen, `git diff`, `git ls-files components/`, dort weitermachen — nichts doppelt bauen.

## Handoff
Backend nötig und noch nicht gebaut: „Frontend steht (Stubs laut Vertrag). Nächster Schritt: `/backend <ID>`."
Sonst: „Frontend steht. Nächster Schritt: `/qa <ID>`."

## Commit
```
feat(<ID>): Implement frontend for [feature]
```
