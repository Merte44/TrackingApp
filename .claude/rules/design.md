---
paths:
  - "docs/design/**"
  - "docs/design-system.md"
  - "global.css"
  - "tailwind.config.js"
---

# Design-Regeln (Design-Kopplung)

## Quellen
- **Repo ist Quelle für Tokens und Komponenten:** `global.css` (HSL-Tokens light + dark, `--radius`), `tailwind.config.js` (Klassen, `fontFamily`), `components/` (Primitives + Kompositionen), `docs/design-system.md` (lesbare Referenz)
- **Claude Design ist Quelle für Screens:** neue Screens werden dort im echten Look entworfen und als `docs/design/screens/<ID>.html` exportiert
- **`docs/design/mockup.html` ist Archiv / Erstquelle:** wird nur von `/init` und `/design tokens` gelesen — nie von `/frontend`

## Sync-Richtungen
| Richtung | Wann | Wie |
|----------|------|-----|
| Repo → Claude Design | nach jedem Release, nach jedem `/design tokens` | `/design sync` (DesignSync: plan → write, inkrementell ins Design-System-Projekt) |
| Claude Design → Repo | pro Feature-Screen, vor `/frontend` | `/design screen <ID>` → `docs/design/screens/<ID>.html`, Link in der Spec-Sektion **Design** |

- Nie in beide Richtungen gleichzeitig editieren: erst sync, dann entwerfen, dann exportieren
- Einmalig `/design-login` (pro Mac, nicht pro App), bevor ein Sync möglich ist
- **Verknüpfung pro App** liegt in `docs/ENVIRONMENTS.md`, Abschnitt Design-Kopplung: projectId des Design-System-Projekts (von `/design sync` beim ersten Lauf angelegt) + Name des Screens-Projekts. Nie in Skills oder Rules

## Token-Disziplin
- Tokens nach **Bedeutung** benennen (`background`, `primary`, `destructive`, `success`), nie nach Farbe
- Jede Farbe light **und** dark; Domänenfarben als eigene Tokens
- Re-Theme = `/design tokens` erneut; Komponenten bleiben unangetastet
- Web-only-Konstrukte (`::before`, CSS-Grid, `hover`, `sticky`) werden in `docs/design-system.md` als 🔴/🟡 markiert, bevor `/frontend` sie trifft
