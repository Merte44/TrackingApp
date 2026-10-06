---
name: sync-template
description: Bulk-Sync zwischen Template und App-Projekt in gewählter Richtung — .claude/ (rules, skills, agents), Vorlagen, generische Docs, Configs. Projektdateien werden nie überschrieben. Endet mit /check.
argument-hint: "from-template <pfad-zum-template> | to-template <pfad-zum-template>"
user-invocable: true
---

# Template-Sync

## Rolle
Du hältst Template und App-Projekte deckungsgleich — **bulk**, nicht Datei für Datei triagiert. Das Template ist die kanonische Quelle des Workflows; Verbesserungen aus einer App fließen bewusst zurück.

## Voraussetzung
Beide Repos haben einen sauberen Arbeitsbaum (`git status --short` leer). Sonst erst committen. Der Sync selbst ist ein normaler Commit und damit rückgängig machbar.

## Was synchronisiert wird (Sync-Menge)
```
.claude/rules/**            .claude/skills/**           .claude/agents/**
.claude/settings.json       .mcp.json                   docs/MCP.md
docs/NEW-PROJECT.md         docs/design/README.md       docs/design/screens/README.md
features/README.md          AGENTS.md                   .github/workflows/**
scripts/check-spec-refs.py
.env.local.example          eslint.config.js  babel.config.js  metro.config.js  components.json  tsconfig.json
```
Gevendorte Expo-Skills (`expo-deployment`, `upgrading-expo`, `native-data-fetching`, `eas-update-insights`) gehören dazu — sie werden nur im Template aktualisiert.

## Nie überschreiben (Projektdateien)
```
CLAUDE.md   docs/PRD.md   features/INDEX.md   features/<ID>-*.md   docs/ENVIRONMENTS.md   docs/RELEASES.md
docs/INBOX.md   docs/design-system.md   docs/design/mockup.html   docs/design/screens/<ID>-*.html
docs/qa/**   docs/release-checks/**   global.css   tailwind.config.js   app.json   eas.json   package.json
app/**   components/**   lib/**   hooks/**   supabase/**
```
Vorlagen mit Projektinhalt (RELEASES, ENVIRONMENTS, INBOX) werden nur angelegt, wenn sie **fehlen**.

## Ablauf
1. Richtung aus dem Argument; Quelle und Ziel benennen und bestätigen lassen
2. Vorschau: `rsync -rcn --delete --itemize-changes` über die Sync-Menge (Ziel `.claude/skills/` mit `--delete`, damit entfernte Skills/Dateien auch im Ziel verschwinden). Liste zeigen, freigeben lassen
3. Ausführen (`rsync -rc --delete` je Pfad); fehlende Vorlagen kopieren
4. **`/check`** im Ziel laufen lassen — null Findings ist das Ziel; Findings sind Projektspezifika, die in Skills gerutscht sind (zurück in CLAUDE.md/ENVIRONMENTS) oder tote Verweise
5. Richtung `to-template`: vorher in der App nach Projektspezifika greppen (App-Name, Project-Refs, Feature-IDs als Beispiele) und generisch machen — erst dann kopieren
6. Ein Commit pro Repo: `chore: sync template <version/commit>`
7. **Beide Repos pushen** und mit `git status -sb` bestätigen, dass keins mehr „voraus“ steht — ein nur lokal committetes Template ist nicht gesichert

## Nicht tun
Datei-für-Datei-Diff-Diskussion · Projektdateien anfassen · Sync bei schmutzigem Arbeitsbaum

## Handoff
„Sync abgeschlossen, `/check` <n> Findings. Nächster Schritt: `/help`."
