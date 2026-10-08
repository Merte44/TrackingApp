---
name: autopilot
description: Fährt ein Feature vom aktuellen Status bis Approved — ruft /write-spec, /architecture, /backend, /frontend und /qa nacheinander auf und hält nur an echten Checkpoints. Nie /deploy, nie prod.
argument-hint: "[<ID>] (ohne: nächstes offenes Feature)"
user-invocable: true
---

# Autopilot

## Rolle
Du orchestrierst **ein** Feature. Du baust nichts selbst: du bestimmst die nächste Phase, rufst den passenden Skill auf und gehst weiter, sobald er fertig ist. Entscheidungen trifft der User — an den Checkpoints unten, sonst nirgends.

Der Aufruf `/autopilot <ID>` ist die **Vorab-Freigabe** für die Phasen `/write-spec` bis `/qa` dieses Features (`.claude/rules/general.md`, Human-in-the-Loop). Harte Checkpoints bleiben.

## Vor dem Start
1. Projekt initialisiert? (`.claude/rules/general.md`, Projekt-Erkennung) — sonst Stopp mit Hinweis auf `/init`
2. `features/INDEX.md` lesen und das Feature bestimmen:
   - mit `<ID>`: dieses
   - ohne: niedrigste offene P0 (dann P1 …), deren **Deps** alle mindestens **Approved** sind
3. **Deps prüfen:** Ist eine Abhängigkeit noch nicht Approved → Stopp: „<ID> hängt an <Dep> (Status …). Erst `/autopilot <Dep>`."
4. `git status --short` — uncommitteter Stand? Fragen: committen, verwerfen oder abbrechen. Der Autopilot startet nur auf sauberem Stand, damit jede Phase einen eigenen Commit hat
5. Backend-Modus aus `CLAUDE.md` bestimmen (`.claude/rules/general.md`, Backend-Modus)
6. Eine Zeile ausgeben: „Autopilot <ID> — <Feature>, Status <S>. Nächste Phase: `/<skill>`."

## Schleife
Der Zustand steht nur in Dateien: Status in `features/INDEX.md` und **Verlauf** der Spec. Vor jeder Phase neu lesen — nie aus dem Gedächtnis, auch nicht nach einer Kontext-Kompaktierung. Darum kann ein abgebrochener Lauf mit `/autopilot <ID>` jederzeit fortgesetzt werden.

### 1. Nächste Phase bestimmen
Routing wie in `/help` (Abschnitt „Nächsten Schritt bestimmen") — eingeschränkt auf dieses Feature, mit dieser Reihenfolge:

| Status | Phase |
|--------|-------|
| Roadmap | `/write-spec <ID>` |
| Planned | `/architecture <ID>` |
| Architected / In Progress | **Daten zuerst:** Braucht das Feature laut **Daten & Server** eine Datenschicht und fehlt im Verlauf „Backend gebaut" → `/backend <ID>`. Sonst fehlt „Frontend gebaut" und das Feature hat Screens → `/frontend <ID>`. Sonst → `/qa <ID>` |
| In Review | letzte QA-Runde NOT READY → Checkpoint „QA NOT READY" |
| Approved | Ende |

Daten vor UI und nacheinander statt parallel: das Frontend nutzt echte `lib/`-Funktionen statt Stubs, und es entstehen keine Worktree-Merges zwischen zwei gleichzeitigen Läufen.

### 2. Ankündigen
`→ Phase <n>: /<skill> <ID>` — eine Zeile, keine Erklärung des Frameworks.

### 3. Ausführen
Den Skill per Skill-Tool aufrufen und vollständig durchlaufen lassen — mit seinen eigenen Interviews, Reviews, Freigaben und seinem Commit. Seine Handoff-Zeile („Nächster Schritt: …") ist hier **kein Stopp**: sie wird zur nächsten Runde der Schleife.

### 4. Nachprüfen
- Status in INDEX und Spec-Header stimmen überein und haben sich wie erwartet bewegt (Write-Then-Verify)
- Die Phase ist committet (`git log -1 --oneline`, `git status --short` leer). Fehlt der Commit → nach dem Commit-Abschnitt des Skills nachholen
- Hat sich nach einem vollständigen Lauf **nichts** bewegt → Stopp mit Befund. Keine zweite Runde derselben Phase

Dann zurück zu Schritt 1.

## Checkpoints — hier hält der Autopilot an

| Checkpoint | Wer fragt | Danach |
|------------|-----------|--------|
| Spec-Interview und Freigabe des Entwurfs | `/write-spec` | weiter |
| **Architektur-Review** (harter Checkpoint) | `/architecture` | weiter nach Freigabe |
| Review des Agenten-Diffs | `/frontend` / `/backend` | weiter |
| Destruktive Migration | `/backend` | weiter nach Bestätigung |
| **QA NOT READY** | Autopilot, per `AskUserQuestion`: „n Bugs (x Frontend, y Backend) — Fix-Runde starten?" Optionen: Fix-Runde (Empfohlen) · Stopp | Ja → `/backend` bzw. `/frontend` mit dem Report aus `docs/qa/`, dann erneut `/qa`. Nein → Stopp |
| **Zweiter Fehlschlag an derselben Stelle** (Abbruchregel aus `/qa`) | Autopilot | **Stopp**, Vorschlag `/refine <ID>` |
| Deps nicht erfüllt · Spec widerspricht dem Code · Phase bewegt nichts | Autopilot | Stopp mit Begründung |

Alles andere läuft ohne Rückfrage. Keine zusätzlichen „Weiter?"-Fragen zwischen den Phasen — dafür gibt es den Autopiloten.

## Nie automatisch
- `/deploy`, alles auf prod, EAS-Builds — Releases sind gebatcht und bleiben eine eigene Entscheidung
- `/refine` — Spec-Änderungen nur auf Zuruf
- Ein zweites Feature. Ein Lauf = ein Feature

## Ende
Bei **Approved** eine kurze Zusammenfassung:
- **Phasen** mit Commit-Hash je Phase
- **Offen:** „needs device check"-Punkte aus `/qa` (gehen an `/deploy`), neue Einträge unter **Grenzen**
- **Nächstes Feature:** `/autopilot <nächste ID>` (Auswahl wie in „Vor dem Start", Schritt 2) — nur vorschlagen, nicht starten

Bei Stopp: wo und warum angehalten wurde, und der exakte Befehl zum Fortsetzen (`/autopilot <ID>` oder der vorgeschlagene Skill).

## Nicht tun
Selbst Code, Specs oder Designs schreiben (das machen die aufgerufenen Skills) · Checkpoints der Skills überspringen oder vorwegnehmen · Phasen parallel starten · Status setzen, ohne dass der zuständige Skill gelaufen ist
