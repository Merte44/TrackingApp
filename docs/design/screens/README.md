# Screens (eine Datei pro Feature)

Hier liegt **pro Feature-Screen eine HTML-Datei**: `<ID>.html`. Das ist die Design-Vorlage, die `/frontend`
für genau dieses Feature liest — nie das Gesamt-Mockup.

**Woher die Dateien kommen**
- `/design screen <ID>` — Export aus Claude Design (Richtung 2 der Design-Kopplung, siehe `.claude/rules/design.md`)
- oder herausgelöst aus `docs/design/mockup.html` (Archiv/Erstquelle), wenn kein Claude-Design-Projekt existiert

**Regeln**
- Dateiname = Feature-ID (`<ID>.html`); mehrere Screens eines Features: `<ID>-detail.html`
- Selbst-enthaltend (Inline-CSS), keine externen Assets
- Der *Look* kommt aus den Tokens (`global.css`, `docs/design-system.md`); die Screen-Datei liefert Layout und Inhalt
- Die Spec verlinkt die Datei in der Sektion **Design**
