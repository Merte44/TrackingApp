---
name: check
description: Skill-Selbstprüfung — findet tote Verweise und veraltete Aussagen in .claude/ (Skills, Rules, Agents) und CLAUDE.md: nicht existierende Dateien, unbekannte Skills, falsche MCP-Server-Namen, Projektspezifika im Template-Teil. Läuft am Ende von /sync-template und in /help.
argument-hint: "(kein Argument)"
user-invocable: true
---

# Check

## Rolle
Du prüfst, ob das, was Skills, Rules, Agents und `CLAUDE.md` behaupten, im Repo existiert. Ziel: **null Findings**. Jeder Fund ist entweder eine tote Referenz (fixen) oder ein Projektspezifikum im generischen Teil (nach CLAUDE.md / ENVIRONMENTS verschieben).

## Schnell-Check (für `/help`)
Nur Schritt 1 des Skripts (veraltete Muster). Dauert Sekunden.

## Voll-Check
Das Skript unten ausführen, jede Zeile der Ausgabe ist ein Finding. Danach:
- Finding beheben (Verweis korrigieren, Datei anlegen, Muster ersetzen) **oder** begründet als Ausnahme im Bericht nennen
- Kurz berichten: Anzahl Findings vorher/nachher, was geändert wurde

```bash
#!/usr/bin/env bash
# Läuft im Repo-Root. Ausgabe = Findings (leer = sauber).
set -u
VENDORED="expo-deployment upgrading-expo native-data-fetching eas-update-insights"
BUILTIN="code-review security-review simplify run schedule loop design-login mcp help init clear"
# Gevendorte Expo-Skills sind Upstream-Doku und werden nicht geprüft
OWN_SKILLS=$(ls -d .claude/skills/*/ | grep -vE "$(echo $VENDORED | tr ' ' '|')")
SCOPE=".claude/rules $OWN_SKILLS .claude/agents CLAUDE.md"

# 1. Veraltete Muster (Lehren aus v2)
grep -rnE -- '--read-only|mcp__supabase__[a-z]|\.maestro/|qa-engineer|Mockup-Screen|## QA Test Results|## Deployment$|`/security`' $SCOPE \
  | grep -v 'skills/check/' | sed 's/^/STALE  /'

# 2. Relative Markdown-Links in Skills/Rules/Agents → Datei muss existieren
grep -rnoE '\]\(([^)#h][^)]*\.md)\)' .claude/rules .claude/skills .claude/agents | while IFS=: read -r f _ m; do
  p=$(echo "$m" | sed -E 's/^\]\((.*)\)$/\1/'); d=$(dirname "$f")
  [ -e "$d/$p" ] || [ -e "$p" ] || echo "LINK   $f → $p fehlt"
done

# 3. Erwähnte Repo-Pfade (.claude/… , docs/… .md, features/… .md) müssen existieren — außer per-Projekt erzeugte
grep -rnoE '`(\.claude/[A-Za-z0-9_./-]+\.md|docs/[A-Za-z0-9_./-]+\.md|features/[A-Za-z0-9_./-]+\.md)`' $SCOPE | while IFS=: read -r f _ m; do
  p=$(echo "$m" | tr -d '`')
  case "$p" in *'<ID>'*|docs/design-system.md|features/MAPPING.md|docs/qa/*|*YYYY*|*\<*) continue;; esac
  [ -e "$p" ] || echo "PATH   $f → $p fehlt"
done

# 4. Skill-Verweise — nur Backtick-Form `/name`, damit Text wie "`—`/empty" keinen Fehlalarm gibt
grep -rnoE '`/[a-z][a-z-]+`' $SCOPE | grep -v 'skills/check/' | sed -E 's/`\/([a-z-]+)`$/\t\1/' | while IFS=$'\t' read -r loc name; do
  [ -d ".claude/skills/$name" ] && continue
  echo " $BUILTIN $VENDORED " | grep -q " $name " && continue
  echo "SKILL  $loc → /$name unbekannt"
done | sort -u

# 5. MCP-Server-Namen in mcp__<server>__ müssen in .mcp.json stehen
grep -rnoE 'mcp__[a-z-]+__' $SCOPE | grep -v 'skills/check/' | cut -d: -f3- | sort -u | while read -r m; do
  s=$(echo "$m" | sed -E 's/^mcp__(.*)__$/\1/')
  grep -q "\"$s\"" .mcp.json || echo "MCP    Server '$s' wird referenziert, fehlt in .mcp.json"
done

# 6. Agents, die in Skills genannt werden, müssen existieren (und umgekehrt keine Waisen)
grep -rnoE '\.claude/agents/[a-z-]+\.md' .claude/skills | sort -u | while IFS=: read -r f _ p; do
  [ -e "$p" ] || echo "AGENT  $f → $p fehlt"
done
for a in .claude/agents/*.md; do
  grep -rq "$(basename "$a")" .claude/skills || echo "AGENT  $a wird von keinem Skill genutzt"
done

# 7. Projektspezifika im generischen Teil: App-Name aus app.json darf in .claude/ nicht vorkommen
APP=$(sed -nE 's/.*"name": *"([^"]+)".*/\1/p' app.json | head -1)
[ -n "$APP" ] && grep -rniF "$APP" .claude | grep -v 'skills/check/' | sed 's/^/PROJ   /'
```

## Nicht tun
Inhaltliche Umschreibungen von Skills — nur Verweise/Muster reparieren. Gevendorte Expo-Skills nicht anfassen (Findings dort nur melden).

## Handoff
„Check: <n> Findings → <behoben / Ausnahmen>." Bei `/sync-template` ist das der Schlussbericht.
