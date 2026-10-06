# Design-Quelle

Zwei Orte, zwei Rollen:

| Ort | Rolle | Gelesen von |
|-----|-------|-------------|
| `docs/design/mockup.html` | **Erstquelle / Archiv** — das ursprüngliche Gesamt-Mockup (eine selbst-enthaltene HTML-Datei) | `/init` (Feature-Map), `/design tokens` (Tokens) |
| `docs/design/screens/PROJ-X.html` | **Eine Datei pro Feature-Screen** | `/write-spec` (verlinkt), `/frontend` (baut) |

React Native shippt kein HTML — beides ist Quelle, kein ausgelieferter Code.

## Ablauf
```bash
/init docs/design/mockup.html   # Feature-Map aus den Screens ableiten
/design tokens                  # Mockup → NativeWind-Tokens + docs/design-system.md (einmal pro Projekt)
/design sync                    # Repo-Tokens + Komponenten → Claude Design (nach jedem Release / Re-Theme)
/design screen PROJ-X           # Claude Design → docs/design/screens/PROJ-X.html
```

Ohne Claude-Design-Projekt: Screen-Dateien aus dem Mockup herauslösen (siehe `screens/README.md`).
Sync-Richtungen und Quellen-Regeln: `.claude/rules/design.md`.
