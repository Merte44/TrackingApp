---
name: autopilot
description: Zwei Modi — `plan` (Spec, Architektur, Plan, Screen-Entwurf mit den Rückfragen bis zur Freigabe des Design-Pakets) und `build` (freigegebene Features ohne Rückfragen nacheinander bis Approved bauen). Ohne Modus beides für ein Feature. Nie /deploy, nie prod.
argument-hint: "plan [<ID>] | build [<ID>] | <ID>"
user-invocable: true
---

# Autopilot

## Rolle
Du orchestrierst. Du baust nichts selbst: du bestimmst die nächste Phase, rufst den passenden Skill auf und gehst weiter, sobald er fertig ist.

Zwei Modi, getrennt durch **eine** Freigabe — das **Design-Paket**:

| Modus | Was | Rückfragen |
|-------|-----|------------|
| `plan [<ID>]` | Spec, Architektur, Plan, Screen-Entwurf → Design-Paket | ja — Interview und Klärungsfragen wie von Hand; endet mit der Freigabe |
| `build [<ID>]` | Bauen, QA, Fix-Runden → Approved | nein — nur harte Stopps |
| `<ID>` | `plan`, nach der Freigabe direkt `build` für dieses Feature | wie die beiden Modi |

So lassen sich mehrere Features nacheinander durchplanen und später in einem Lauf bauen. Die Freigabe des Design-Pakets ist die **Vorab-Freigabe** für alle Bauphasen bis `/qa` dieses Features (`.claude/rules/general.md`, Human-in-the-Loop).

## Vor dem Start (beide Modi)
1. Projekt initialisiert? (`.claude/rules/general.md`, Projekt-Erkennung) — sonst Stopp mit Hinweis auf `/init`
2. `git status --short` — uncommitteter Stand? Fragen: committen, verwerfen oder abbrechen. Gestartet wird nur auf sauberem Stand
3. Backend-Modus aus `CLAUDE.md` bestimmen (`.claude/rules/general.md`, Backend-Modus)

**Freigegeben** heißt: die Spec hat die Verlauf-Zeile „Design-Paket freigegeben". Der Zustand steht nur in Dateien — Status in INDEX und Spec-Header, **Plan**-Tabelle, **Verlauf**, Design-Link unter **Design**. Vor jeder Phase neu lesen, nie aus dem Gedächtnis. Darum lässt sich jeder abgebrochene Lauf mit demselben Befehl fortsetzen.

---

## `plan` — bis zum Design-Paket (mit Rückfragen)

**Feature wählen:** mit `<ID>` dieses; ohne: niedrigste nicht freigegebene P0 (dann P1 …) in INDEX, deren **Deps** alle freigegeben oder Approved sind. Geplant wird gegen die Verträge der Dep-Specs — gebaut sein müssen sie dafür nicht.

Ausgabe: „Autopilot plan <ID> — <Feature>, Status <S>. Nächste Phase: `/<skill>`."

| Zustand | Phase |
|---------|-------|
| Roadmap | `/write-spec <ID> --paket` |
| Planned | `/architecture <ID> --paket` (schreibt auch `## Plan`) |
| Architected, Feature hat **Screens**, kein freigegebener Screen (keine Datei unter `docs/design/screens/<ID>*.html`, kein Design-Link in der Spec) | `/design screen <ID>` — Entwurf als Design-Artifact (Schritt 3b dort) |
| Architected, nicht freigegeben | → **Design-Paket** |
| freigegeben | Ende — „<ID> ist schon freigegeben. Bauen: `/autopilot build`." |

`--paket`: Interview bzw. Klärungsfragen laufen **normal** mit dem User; nur die abschließende Freigabe des Skills entfällt („Entwurf zeigen" in `/write-spec`, Review in `/architecture`) — sie ist das Design-Paket. Jeder Skill committet wie gewohnt.

Backend-only-Features (Screens & Komponenten „—") haben keinen Screen-Entwurf; ihr Paket besteht aus Spec und Plan.

### 🛑 Design-Paket — die eine Freigabe
Eine Nachricht, kurz:
- **Design:** der Link zum Design-Artifact (nur bei Features mit Screens)
- **Was gebaut wird:** „Was es tut" in zwei Sätzen, die ACs als Liste (ID + Kurzform)
- **Plan:** die Aufgabentabelle; Aufgaben der Ebene **Du** (`U…`) hervorheben
- Dann `AskUserQuestion`: „Freigeben?" — Optionen: **Freigeben (Empfohlen)** · **Ändern** (User beschreibt, was)

**Ändern:** Spec, Plan bzw. Design-Artifact anpassen, Status bleibt, Paket erneut zeigen. **Freigeben:** Screen-Datei(en) aus dem Artifact nach `docs/design/screens/` holen (`/design` Schritt 3b), Verlauf-Zeile „Design-Paket freigegeben", committen: `docs(<ID>): Approve design package`.

**Ende von `plan`:** „<ID> freigegeben. Nächstes planbares Feature: `/autopilot plan <nächste ID>` · Bauen: `/autopilot build`." Modus `<ID>` geht stattdessen direkt in `build <ID>`.

---

## `build` — freigegebene Features bis Approved (ohne Rückfragen)

**Warteschlange:**
- mit `<ID>`: nur dieses — es muss freigegeben sein, sonst Stopp: „<ID> ist nicht freigegeben. Erst `/autopilot plan <ID>`."
- ohne: **alle** freigegebenen Features unter Approved, Deps zuerst, sonst nach Prio und ID. Ein Feature kommt nur dran, wenn alle Deps Approved sind (oder es in diesem Lauf geworden sind)

Ausgabe: „Autopilot build — Warteschlange: <ID>, <ID>, …"

Pro Feature, nacheinander:

| Zustand | Phase |
|---------|-------|
| offene Backend-Aufgaben im Plan | `/backend <ID> --auto` |
| offene Frontend-Aufgaben im Plan | `/frontend <ID> --auto` |
| alle Aufgaben erledigt, Status In Progress | `/qa <ID> --auto` |
| In Review, letzte Runde NOT READY | Fix-Runde: `/backend` bzw. `/frontend <ID> --auto` mit dem Report aus `docs/qa/`, dann erneut `/qa <ID> --auto` (neuer QA-Agent) |
| Approved | nächstes Feature der Warteschlange |

Spec ohne `## Plan` (älter angelegt): Routing nach Verlauf („Backend gebaut", „Frontend gebaut").

Daten vor UI und nacheinander statt parallel: das Frontend nutzt echte `lib/`-Funktionen statt Stubs, und es gibt nur eine Arbeitskopie. Zwischen zwei Features nichts mitnehmen — alles neu aus den Dateien lesen.

**Harter Stopp bei einem Feature:** dieses Feature und alle, die davon abhängen, aus der Warteschlange nehmen; mit den übrigen weitermachen. Am Ende stehen sie im Bericht.

### Nach jeder Phase prüfen
- Status in INDEX und Spec-Header stimmen überein und haben sich wie erwartet bewegt; Plan-Tabelle abgehakt
- Die Phase ist committet (`git status --short` leer)
- Hat sich nach einem vollständigen Lauf **nichts** bewegt → harter Stopp mit Befund. Keine zweite Runde derselben Phase

## Abweichungen der Skills bei `--auto` (nur `build`)

| Skill | statt Rückfrage | so |
|-------|-----------------|----|
| `/backend`, `/frontend` | Klären, Diff-Review mit User | Offenes mit der Empfehlung entscheiden und als **Annahme (Autopilot)** ins Decision Log; statt Diff-Review `/code-review` über die Phase — Critical/High beheben, bevor committet wird |
| `/qa` | Fix-Runde starten? | Automatisch Fix-Runde, jedes Mal mit neuem QA-Agent |

Eine Annahme ist kein Stopp — sie steht im Decision Log und im Abschlussbericht.

## Harte Stopps (`build`)

| Stopp | Warum |
|-------|-------|
| **Destruktive Migration** (Tabelle/Spalte weg, Typ verengen) | Modus lokal: die Datei auf dem Gerät ist die einzige Kopie der Daten |
| **Zweiter QA-Fehlschlag an derselben Stelle** (Abbruchregel aus `/qa`) | Entwurfsproblem — Vorschlag `/refine <ID>` |
| **Aufgabe der Ebene Du** (`U…`), die eine Folgeaufgabe blockiert | nur der User kann sie erledigen; nicht blockierende sammeln und am Ende nennen |
| Spec widerspricht dem Code · Phase bewegt nichts | Befund im Bericht |

## Nie automatisch
- `/deploy`, alles auf prod, EAS-Builds, `git push`
- `/refine` — außer für Änderungen, die der User am Design-Paket verlangt
- Ein nicht freigegebenes Feature bauen

## Abschlussbericht (`build`)
Kurz, pro Feature der Warteschlange:
- **Approved:** Commits je Aufgabe, QA-Runden mit gefundenen und behobenen Bugs, Ergebnis pro AC (Kurzform)
- **Angehalten:** wo und warum, der exakte Befehl zum Fortsetzen; übersprungene abhängige Features
- **Annahmen (Autopilot)** — der User soll sie kennen
- **Offen:** „needs device check" aus `/qa`, nicht blockierende `U…`-Aufgaben, neue Einträge unter **Grenzen**

## Nicht tun
Selbst Code, Specs oder Designs schreiben (das machen die aufgerufenen Skills) · harte Stopps überspringen · Phasen parallel starten · Status setzen, ohne dass der zuständige Skill gelaufen ist · in `build` Rückfragen stellen · pushen
