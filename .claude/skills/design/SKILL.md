---
name: design
description: Design-Kopplung in drei Modi — `tokens` (Mockup/Beschreibung → NativeWind-Tokens + design-system.md + Fonts, einmalig/Re-Theme), `sync` (Repo → Claude Design), `screen <ID>` (Claude Design bzw. neuer Design-Artifact-Entwurf mit Link → docs/design/screens/<ID>.html).
argument-hint: "tokens [pfad] | sync | screen <ID>"
user-invocable: true
---

# Design-Kopplung

## Rolle
Du bist Design-Systems-Engineer. Du hältst Repo und Claude Design synchron: **Repo ist Quelle für Tokens + Komponenten, Claude Design ist Quelle für Screens** (`.claude/rules/design.md`). Screens baust du nicht — das ist `/frontend`.

## Modus wählen
Argument lesen. Ohne Argument: fragen, mit Empfehlung (kein `docs/design-system.md` → `tokens`; sonst `sync`).

---

## `tokens` — Design-Quelle → Token-System (einmal pro Projekt, erneut bei Re-Theme)

**Quelle:** `docs/design/mockup.html` (Default), eine andere HTML-Datei, oder eine Beschreibung. Existiert `docs/design-system.md` schon → Re-Theme, Überschreiben bestätigen lassen.

1. **Extrahieren:** Palette (Hintergrund, Flächen, Text-Stufen, Ränder, Primär/Akzent, Destruktiv, Domänenfarben) light **und** dark; Typografie (Familien, Gewichte, Skala); Radius, Spacing, Schatten. Bei Varianten (Tweaks-Panel) Default mit dem User wählen
2. **Mappen:** hex → HSL-Tripel (echt rechnen), semantische Namen (`background`, `primary`, `destructive`, `success`), nie Farbnamen; `--radius`; Fonts nach `tailwind.config.js` `fontFamily`
3. **Buildability ehrlich markieren:** 🔴 web-only (`::before/::after`, Grid, `sticky`, `hover`, `color-mix`) mit RN-Ansatz · 🟡 aufwendig (Keyframes → Reanimated, Blur → expo-blur, Gradients) · ✅ sauber
4. **Fonts bündeln:** `npx expo install expo-font @expo-google-fonts/<family>` (oder `assets/fonts/`), `useFonts` in `app/_layout.tsx`, ersten Render gaten
5. **Schreiben:** `global.css` (`:root` + `.dark:root`), `tailwind.config.js` (fontFamily, neue semantische Farben), `docs/design-system.md` (selbst-enthaltend: Token-Tabelle light/dark/Bedeutung, Typo-Skala, Spacing, Radius, Komponenten-Notizen, Buildability-Flags)
6. **Review:** Palette + Typo + Flags vor dem Schreiben zeigen; Feedback einarbeiten
7. Danach `sync` anbieten, damit Claude Design den neuen Look kennt

Commit: `feat: Add design system — NativeWind tokens + design-system.md`

---

## `sync` — Repo → Claude Design (nach jedem Release, nach jedem `tokens`)

Voraussetzung: einmalig `/design-login` (interaktiv). Fehlt der Login → sagen, stoppen.

1. **Projekt auflösen** (die Verknüpfung liegt in `docs/ENVIRONMENTS.md`, Abschnitt Design-Kopplung — nie in Skills). Die dortige „Status"-Zeile ist nur eine Notiz vom letzten Lauf, kein Gate — sie kann veraltet sein. Immer wirklich versuchen, nie an der Notiz allein stoppen:
   - steht dort eine projectId → `get_project` und prüfen, dass es ein Design-System-Projekt ist
   - sonst `list_projects` nach dem App-Namen aus `app.json` durchsuchen
   - sonst `create_project` mit dem App-Namen; die neue projectId **in ENVIRONMENTS eintragen** (Write-Then-Verify)
   - schlägt der Aufruf wirklich fehl (nicht autorisiert) → das ist der einzige echte Stopp-Grund, dann `/design-login` nennen
2. Ist-Zustand sammeln: `global.css`, `tailwind.config.js`, `docs/design-system.md`, `git ls-files components/`
3. **DesignSync-Werkzeug:** `list_files` für den Struktur-Diff, dann `finalize_plan` (zeigt dem User exakt, was geschrieben/gelöscht wird), Freigabe abwarten, dann `write_files` — inkrementell, nichts löschen, was nur in Claude Design existiert
4. Ergebnis kurz melden: neue/geänderte Tokens und Komponenten; in ENVIRONMENTS „Letzter Sync" setzen
5. Spec-übergreifend nichts zu tracken; bei Release in `docs/RELEASES.md` „Design-System synchronisiert" vermerken

> Details des Werkzeugs (Export-Format, Projektzuordnung) werden nach dem ersten `/design-login` verifiziert und in `.claude/rules/design.md` nachgetragen.

---

## `screen <ID>` — Claude Design → Repo (pro Feature, vor `/frontend`)

1. Spec `features/<ID>-*.md` lesen: Sektion **Design** (Screen-Name); das Screens-Projekt steht in `docs/ENVIRONMENTS.md`, Abschnitt Design-Kopplung. Fehlt eines von beiden → mit dem User klären
2. Screen aus Claude Design exportieren (Export / „Send to Claude Code") → als selbst-enthaltende HTML nach `docs/design/screens/<ID>.html` (mehrere Screens: `<ID>-<name>.html`)
3. Kein Claude-Design-Projekt vorhanden → den passenden Screen aus `docs/design/mockup.html` herauslösen (nur dieser Screen, Inline-CSS, keine externen Assets)
3b. **Weder Export noch Mockup → Entwurf als Design-Artifact** (Standard im `/autopilot`):
   - `Artifact` mit `action: "quickstart"`, `intent: "design"` → liefert die `type_url` des Design-Typs; damit ein neues Artifact anlegen (Titel `<ID> <Feature>`) und dessen Anweisungen folgen
   - Inhalt: **ein Artboard pro Screen/Sheet** aus **Screens & Komponenten** der Spec, iPhone-Format; Zustände, die die ACs nennen (leer, Fehler, Lösch-Dialog …), als eigene Artboards. Look aus `docs/design-system.md` + `global.css` (Tokens) und den Design-Vorgaben in `docs/PRD.md` — keine neuen Farben oder Fonts erfinden
   - Ergebnis ist ein **Link** für den User. Er gibt ihn frei oder kommentiert; Änderungen am selben Artifact einarbeiten, bis er zustimmt
   - **Nach der Freigabe:** die Artboards per `Artifact` `action: "read"` mit `path` als HTML holen und nach `docs/design/screens/<ID>.html` (bzw. `<ID>-<name>.html`) legen — `/frontend` liest immer die lokale Datei. Den Link in der Spec unter **Design** zusätzlich nennen
4. Datei gegen die Tokens prüfen: verwendet der Screen Farben/Fonts, die es im Token-System nicht gibt? → dem User melden (Token ergänzen via `tokens` oder Screen anpassen), 🔴/🟡-Konstrukte kurz notieren
5. Spec **Design** aktualisieren (Screen-Datei verlinken), **Verlauf**-Zeile „Screen exportiert"

Commit: `docs(<ID>): Add screen file for [feature]`

---

## Nicht tun
Screens in React Native bauen · Hex in Komponenten · beide Richtungen in einem Lauf

## Handoff
`tokens` → „Tokens stehen. Als Nächstes `/design sync`, dann `/write-spec`." · `sync` → „Claude Design kennt den Ist-Look. Screens dort entwerfen, dann `/design screen <ID>`." · `screen` → „Screen-Datei liegt in der Spec. Nächster Schritt: `/frontend <ID>`."
