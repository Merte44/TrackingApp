---
name: help
description: Kontextbewusster Wegweiser — wo steht das Projekt, was ist der nächste Schritt, was ist im letzten Release und was fehlt in den Umgebungen. Jederzeit nutzbar.
argument-hint: "optionale Frage"
user-invocable: true
---

# Projekt-Hilfe

## Zustand erfassen
1. `docs/PRD.md` — leeres Template? → nicht initialisiert
2. `features/INDEX.md` — Features und Status
3. `docs/RELEASES.md` — letzter Build, was enthalten war, offene Gerätetests
4. `docs/ENVIRONMENTS.md` — unbestätigte Häkchen in „Per-Feature-Setup" (dev/prod)
5. `docs/INBOX.md` — unsortierte Notizen: Anzahl und Datum der ältesten
6. `git status --short` + `git log --oneline -5` — uncommitteter Stand?
7. Kurzer Schnell-Check aus `/check` (Abschnitt „Schnell-Check") — veraltete Verweise in Skills/Rules melden

## Nächsten Schritt bestimmen
- PRD leer → `/init <Idee>` oder `/init docs/design/mockup.html`
- Roadmap-Features ohne Spec → `/write-spec <ID>` (niedrigste offene P0 zuerst)
- Planned → `/architecture <ID>`
- Architected → `/frontend <ID>` und/oder `/backend <ID>` (parallel, wenn Verträge in der Spec)
- In Progress (beide Seiten fertig) → `/qa <ID>`
- In Review mit Bugs → `/frontend` / `/backend` mit Report aus `docs/qa/`
- Mehrere Approved → Sammel-Release: `/deploy` (Release-Check, RELEASES-Eintrag). **Nicht drängeln** — gebatchte Deploys sind Absicht; nur neutral nennen
- Alles Deployed → nächstes Roadmap-Feature oder (nur Modus supabase) `/ops` für den Betriebs-Check

Für Features vor Approved zusätzlich `/autopilot` anbieten: `plan <ID>` (Spec bis Design-Paket, mit Rückfragen), `build` (alle freigegebenen Features ohne Rückfragen bis Approved).

## Ausgabe
**Projektstand** (2–3 Sätze) · **Features** (Tabelle aus INDEX) · **Letztes Release** (aus RELEASES) · **Umgebungen** (offene Häkchen) · **Eingang** (nur wenn nicht leer: Anzahl + Alter der ältesten Notiz, mit dem Hinweis, dass `/refine` bzw. `/write-spec` sie einsortiert) · **Empfohlener nächster Schritt** (ein Befehl) · **Weitere Optionen**.

Hat der User eine Frage gestellt, zuerst die beantworten. Kurz, mit exakten Befehlen und Dateipfaden; Framework nicht erklären, außer gefragt.

## Skills-Überblick (bei Frage „was gibt es?")
Workflow `/init` `/write-spec` `/architecture` `/frontend` `/backend` `/qa` `/deploy` · Orchestrierung `/autopilot` · Design `/design tokens|sync|screen` · Pflege `/refine` `/ops` `/check` `/sync-template` · eingebaut `/code-review` `/security-review` `/simplify` `/run` `/schedule` · gevendort `expo-deployment` `upgrading-expo`.
