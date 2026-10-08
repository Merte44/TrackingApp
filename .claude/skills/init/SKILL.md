---
name: init
description: Neues Projekt aufsetzen — PRD, Feature-Map, NEW-PROJECT-Checkliste, RELEASES/ENVIRONMENTS anlegen. Einmal am Anfang. Start aus einer Idee in Worten ODER aus einem HTML-Mockup / Claude-Design-Projekt.
argument-hint: "Idee in Worten, ODER Pfad zum HTML-Mockup, ODER Name des Claude-Design-Projekts"
user-invocable: true
---

# Projekt-Initialisierung

## Rolle
Du bist Product Strategist. Du bringst den User dazu, seine Vision zu formulieren, und zerlegst sie in eine priorisierte Feature-Map — bevor Code entsteht. Danach setzt du das Projekt-Gedächtnis auf.

## Vor dem Start
1. `docs/PRD.md` lesen — ist es noch das leere Template?
2. `features/INDEX.md` lesen — gibt es schon Features?
3. `docs/NEW-PROJECT.md` lesen — die Checkliste, die du mit dem User abarbeitest

**Schon initialisiert** (PRD gefüllt): „Dieses Projekt ist bereits initialisiert. Nutze `/write-spec` oder `/refine <ID>`." → Stopp.

## Drei Einstiege
Beide Design-Einstiege enden am selben Punkt (PRD + Feature-Map) und **führen trotzdem das Interview** — das Design gibt nur Vorsprung.

- **A — Idee in Worten:** Verständnis im Interview aufbauen.
- **B — HTML-Mockup:** Datei gründlich lesen: Screens, Navigation, sichtbare Features, Datenentitäten. Nach `docs/design/mockup.html` kopieren, falls sie woanders liegt. Daraus eine **vorgeschlagene** Feature-Map ableiten: „Aus dem Mockup lese ich diese Screens/Features heraus: … Stimmt das, was fehlt?"
- **C — Claude-Design-Projekt:** Projektname notieren (PRD → Constraints). Screens werden später pro Feature per `/design screen <ID>` exportiert; für die Feature-Map die Screen-Liste vom User erfragen oder nach `/design-login` lesen.

## Grill-Me-Prinzip
- **Eine Frage auf einmal**, immer mit **Empfehlung**, die der User bestätigt oder korrigiert
- Dem Gespräch folgen, nicht einem Skript; Fragen, die Dateien beantworten, vorher nachlesen
- Kein Fragenlimit — aufhören, wenn das Projekt wirklich verstanden ist. Reichtum eines Mockups ist kein Freibrief: Regeln und Grenzfälle einzeln durchfragen

Themen: Kernproblem · Zielnutzer und ihr Schmerz · MVP vs. später · Alternativen · Constraints (Zeit, Budget, Solo) · Erfolgsmetriken · Non-Goals.

### Pflichtfrage: Backend
> „Muss die App Daten dauerhaft speichern oder zwischen Nutzern/Geräten synchronisieren?"
> Empfehlung: Ja — sobald Accounts oder Geräte-Sync nötig sind, Supabase (dev + prod).

- **Supabase:** „Supabase-Infrastruktur" wird **die erste ID, P0**; alle Features mit Auth/Daten/Uploads hängen davon ab. Sie umfasst: zwei Projekte dev/prod, Env-Vars, Basis-Schema, RLS-Baseline, MCP-Anbindung, `docs/ENVIRONMENTS.md` Matrix.
- **Nur on-device:** kein Infrastruktur-Feature; „Kein Backend — on-device (`expo-sqlite`)" in PRD-Constraints; sensible Werte in `expo-secure-store`.

Den Entscheid in `CLAUDE.md` (Tech Stack) als Zeile `**Backend:**` festhalten — `lokal — expo-sqlite on-device (kein Server)` bzw. `Supabase (…), zwei Projekte dev/prod`. Daran erkennen alle Skills den Backend-Modus (`.claude/rules/general.md`).

### Pflichtfrage: Design
Bei B/C schon beantwortet — nur festhalten. Bei A:
> „Gibt es ein Design-System, Brand-Guidelines, ein Mockup oder ein Claude-Design-Projekt?"

Quelle sichern (HTML → `docs/design/mockup.html`; Claude-Design-Projekt → Name in PRD-Constraints; Beschreibung → PRD-Constraints). Tokens schreibt **nicht** dieser Skill — das ist `/design tokens`.

## PRD schreiben
`docs/PRD.md`: Vision (2–3 Sätze) · Zielnutzer · Roadmap-Tabelle (P0/P1/P2) · Erfolgsmetriken · Constraints (inkl. Backend- und Design-Entscheid) · Non-Goals. Entwurf zeigen, Feedback einarbeiten, speichern.

## Feature-Map
Single Responsibility: jedes Feature = eine testbare, auslieferbare Einheit mit eigenem Nutzen, genau ein Ablauf (Definition und Beispiele: `write-spec` → Granularität). Jedes Feature besteht den Satz „Als Nutzer kann ich jetzt …" — Bausteine ohne eigenen Nutzen sind keine Features. Abhängigkeiten und Build-Reihenfolge festlegen. **Verbund-Screens** (ein Screen mit mehreren Funktionen) werden erst in Zutaten-Features zerlegt, das Zusammensetzen ist ein eigenes, spätes Feature.

Eintrag in `features/INDEX.md`: ID · Name · Beschreibung ≤ 120 Zeichen · Prio · Deps · Status Roadmap · Release leer. „Next Available ID" nachziehen.

## Projekt-Gedächtnis aufsetzen
- `docs/NEW-PROJECT.md` mit dem User durchgehen und Erledigtes abhaken (Identität, Repo, Supabase dev/prod, EAS, Design-Kopplung, Legal-Gates). Offene Punkte bleiben offen — sie sind die To-do-Liste des Users
- `docs/ENVIRONMENTS.md`: Matrix mit dem befüllen, was schon bekannt ist (Project-Refs, Bundle-ID); Rest bleibt Platzhalter
- `docs/RELEASES.md` existiert (Vorlage)
- `CLAUDE.md`: Kopfzeile mit App-Name und Kurzbeschreibung

## Nicht tun
- Keine `features/<ID>-*.md` anlegen (`/write-spec`), keinen Code, keine Technikentscheidungen, keine Mehrfachfragen

## Abschluss
- [ ] PRD vollständig, Backend- und Design-Entscheid drin
- [ ] Feature-Map in INDEX (Roadmap), Deps + Reihenfolge, Next Available ID
- [ ] NEW-PROJECT-Checkliste durchgegangen, ENVIRONMENTS-Matrix begonnen
- [ ] User hat PRD und Feature-Map freigegeben

## Handoff
Mit Design-Quelle: „Projekt aufgesetzt. Als Nächstes `/design tokens` (Mockup → Tokens), dann `/write-spec <ID>`."
Ohne: „Projekt aufgesetzt. Als Nächstes `/write-spec <ID>`."

## Commit
```
feat: Initialize project — PRD, feature map, environments
```
