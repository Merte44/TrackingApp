---
name: autopilot
description: Fährt ein Feature vom aktuellen Status bis Approved mit genau einem Stopp — dem Design-Paket (Screen-Entwurf als Link, ACs, Annahmen, Plan). Davor Spec, Design und Architektur automatisch, danach Bauen, QA und Fix-Runden automatisch. Nie /deploy, nie prod.
argument-hint: "[<ID>] (ohne: nächstes offenes Feature)"
user-invocable: true
---

# Autopilot

## Rolle
Du orchestrierst **ein** Feature. Du baust nichts selbst: du bestimmst die nächste Phase, rufst den passenden Skill mit `--auto` auf und gehst weiter, sobald er fertig ist. Der User entscheidet **einmal** — am Design-Paket — und an den harten Stopps unten, sonst nirgends.

Der Aufruf `/autopilot <ID>` ist die **Vorab-Freigabe** für alle Phasen von `/write-spec` bis `/qa` dieses Features (`.claude/rules/general.md`, Human-in-the-Loop).

## Vor dem Start
1. Projekt initialisiert? (`.claude/rules/general.md`, Projekt-Erkennung) — sonst Stopp mit Hinweis auf `/init`
2. `features/INDEX.md` lesen und das Feature bestimmen:
   - mit `<ID>`: dieses
   - ohne: niedrigste offene P0 (dann P1 …), deren **Deps** alle mindestens **Approved** sind
3. **Deps prüfen:** Ist eine Abhängigkeit noch nicht Approved → Stopp: „<ID> hängt an <Dep> (Status …). Erst `/autopilot <Dep>`."
4. `git status --short` — uncommitteter Stand? Fragen: committen, verwerfen oder abbrechen. Gestartet wird nur auf sauberem Stand
5. Backend-Modus aus `CLAUDE.md` bestimmen (`.claude/rules/general.md`, Backend-Modus)
6. Eine Zeile ausgeben: „Autopilot <ID> — <Feature>, Status <S>. Nächste Phase: `/<skill>`."

## Ablauf

Der Zustand steht nur in Dateien: Status in INDEX und Spec-Header, **Plan**-Tabelle, **Verlauf**, Design-Link unter **Design**. Vor jeder Phase neu lesen — nie aus dem Gedächtnis. Darum lässt sich ein abgebrochener Lauf mit `/autopilot <ID>` jederzeit fortsetzen.

### Phase A — bis zum Design-Paket (automatisch)

| Zustand | Phase |
|---------|-------|
| Roadmap | `/write-spec <ID> --auto` |
| Planned | `/architecture <ID> --auto` (schreibt auch `## Plan`) |
| Architected, Feature hat **Screens**, kein freigegebener Screen (keine Datei unter `docs/design/screens/<ID>*.html`) | `/design screen <ID>` — Entwurf als Design-Artifact (Schritt 3b dort) |
| Architected, Paket noch nicht freigegeben (keine Verlauf-Zeile „Design-Paket freigegeben") | → **Stopp: Design-Paket** |

Backend-only-Features (Screens & Komponenten „—") haben keinen Screen-Entwurf; ihr Paket besteht aus Spec und Plan.

### 🛑 Design-Paket — der eine Stopp
Eine Nachricht, kurz:
- **Design:** der Link zum Design-Artifact (nur bei Features mit Screens)
- **Was gebaut wird:** „Was es tut" in zwei Sätzen, die ACs als Liste (ID + Kurzform)
- **Annahmen:** alles, was `/write-spec` und `/architecture` ohne Rückfrage entschieden haben (im Decision Log als „Annahme (Autopilot)") — jeweils mit der getroffenen Wahl und der Alternative
- **Plan:** die Aufgabentabelle; Aufgaben der Ebene **Du** (`U…`) hervorheben
- Dann `AskUserQuestion`: „Freigeben und bis Approved durchbauen?" — Optionen: **Freigeben (Empfohlen)** · **Ändern** (User beschreibt, was)

**Ändern:** Spec, Plan bzw. Design-Artifact anpassen, Status bleibt, Paket erneut zeigen. **Freigeben:** Screen-Datei(en) aus dem Artifact nach `docs/design/screens/` holen (Schritt 3b), Annahmen im Decision Log von „Annahme (Autopilot)" auf normal umstellen, Verlauf-Zeile „Design-Paket freigegeben", committen. Ab hier keine Rückfragen mehr außer den harten Stopps.

### Phase B — bis Approved (automatisch)

| Zustand | Phase |
|---------|-------|
| offene Backend-Aufgaben im Plan | `/backend <ID> --auto` |
| offene Frontend-Aufgaben im Plan | `/frontend <ID> --auto` |
| alle Aufgaben erledigt, Status In Progress | `/qa <ID> --auto` |
| In Review, letzte Runde NOT READY | Fix-Runde: `/backend` bzw. `/frontend <ID> --auto` mit dem Report aus `docs/qa/`, dann erneut `/qa <ID> --auto` (neuer QA-Agent) |
| Approved | Ende |

Spec ohne `## Plan` (älter angelegt): Routing nach Verlauf („Backend gebaut", „Frontend gebaut") wie früher.

Daten vor UI und nacheinander statt parallel: das Frontend nutzt echte `lib/`-Funktionen statt Stubs.

### Nach jeder Phase prüfen
- Status in INDEX und Spec-Header stimmen überein und haben sich wie erwartet bewegt; Plan-Tabelle abgehakt
- Die Phase ist committet (`git status --short` leer)
- Hat sich nach einem vollständigen Lauf **nichts** bewegt → Stopp mit Befund. Keine zweite Runde derselben Phase

## Abweichungen der Skills bei `--auto`
Die aufgerufenen Skills laufen vollständig — mit diesen Ersetzungen für ihre eigenen Rückfragen:

| Skill | statt Rückfrage | so |
|-------|-----------------|----|
| `/write-spec` | Interview | Spec aus PRD, INDEX, Bestand und abhängigen Specs ableiten. Jede Entscheidung, die das Interview geklärt hätte, als **Annahme (Autopilot)** ins Decision Log — mit Wahl und Alternative. Nichts erfinden, was dem PRD widerspricht; echte Lücke im PRD → Annahme, nicht still füllen |
| `/architecture` | Klärungsfragen, Review | Wie oben als Annahmen; Review entfällt — er ist das Design-Paket |
| `/design screen` | — | Entwurf als Design-Artifact, Link fürs Paket |
| `/backend`, `/frontend` | Klären, Diff-Review mit User | Offenes mit der Empfehlung entscheiden und als Decision-Log-Zeile festhalten; statt Diff-Review `/code-review` über die Phase — Critical/High beheben, bevor committet wird |
| `/qa` | Fix-Runde starten? | Automatisch Fix-Runde, jedes Mal mit neuem QA-Agent |

Eine Annahme nach der Freigabe (Phase B) ist kein Stopp — sie steht im Decision Log und im Abschlussbericht.

## Harte Stopps — hier hält der Autopilot auch nach der Freigabe an

| Stopp | Warum |
|-------|-------|
| **Destruktive Migration** (Tabelle/Spalte weg, Typ verengen) | Modus lokal: die Datei auf dem Gerät ist die einzige Kopie der Daten |
| **Zweiter QA-Fehlschlag an derselben Stelle** (Abbruchregel aus `/qa`) | Entwurfsproblem — Vorschlag `/refine <ID>` |
| **Aufgabe der Ebene Du** (`U…`), die eine Folgeaufgabe blockiert | nur der User kann sie erledigen; nicht blockierende sammeln und am Ende nennen |
| Spec widerspricht dem Code · Phase bewegt nichts · Deps nicht erfüllt | Stopp mit Befund |

## Nie automatisch
- `/deploy`, alles auf prod, EAS-Builds, `git push`
- `/refine` — außer für Änderungen, die der User am Design-Paket verlangt
- Ein zweites Feature. Ein Lauf = ein Feature

## Ende
Bei **Approved** ein kurzer Abschlussbericht:
- **Phasen** mit Commit-Hash (Spec, Architektur, Design, je Aufgabe, QA-Runden)
- **QA:** Runden, gefundene und behobene Bugs, Ergebnis pro AC (Kurzform)
- **Annahmen nach der Freigabe** (aus Phase B) — der User soll sie kennen
- **Offen:** „needs device check" aus `/qa`, nicht blockierende `U…`-Aufgaben, neue Einträge unter **Grenzen**
- **Nächstes Feature:** `/autopilot <nächste ID>` — nur vorschlagen, nicht starten

Bei Stopp: wo und warum, und der exakte Befehl zum Fortsetzen.

## Nicht tun
Selbst Code, Specs oder Designs schreiben (das machen die aufgerufenen Skills) · harte Stopps überspringen · Phasen parallel starten · Status setzen, ohne dass der zuständige Skill gelaufen ist · pushen
