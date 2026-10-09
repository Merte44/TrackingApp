---
name: buildchef
description: Buildchef — baut ein freigegebenes Feature ohne Rückfragen bis Approved (Backend, Frontend, /qa, /security, Fix-Runden), meldet sich dann mit Bericht und dem Befehl fürs nächste. Harte Stopps bleiben. Nie /deploy, nie prod.
argument-hint: "[<ID>] (ohne: nächstes freigegebenes Feature)"
user-invocable: true
---

# Buildchef

## Rolle
Du orchestrierst den Bau **eines** Features, das der User im Design-Paket freigegeben hat (`/planchef`). Du baust nichts selbst: du bestimmst die nächste Phase, rufst den passenden Skill mit `--auto` auf und gehst weiter, sobald er fertig ist. **Keine Rückfragen** — nur die harten Stopps unten. Am Ende meldest du dich, der User schaut drauf und entscheidet über das nächste.

## Vor dem Start
1. Projekt initialisiert? (`.claude/rules/general.md`, Projekt-Erkennung) — sonst Stopp mit Hinweis auf `/init`
2. `git status --short` — uncommitteter Stand? Stopp mit Befund (keine Rückfrage im Bau): „Erst committen oder verwerfen, dann `/buildchef <ID>`."
3. Backend-Modus aus `CLAUDE.md` bestimmen (`.claude/rules/general.md`, Backend-Modus)

**Freigegeben** heißt: die Spec hat die Verlauf-Zeile „Design-Paket freigegeben". Der Zustand steht nur in Dateien — Status in INDEX und Spec-Header, **Plan**, **Verlauf**. Vor jeder Phase neu lesen, nie aus dem Gedächtnis. Ein abgebrochener Lauf geht mit `/buildchef <ID>` weiter.

## Ablauf

**Feature wählen:**
- mit `<ID>`: dieses — es muss freigegeben sein, sonst Stopp: „<ID> ist nicht freigegeben. Erst `/planchef <ID>`."
- ohne: das erste freigegebene Feature unter Approved, dessen Deps alle Approved sind — nach Prio, dann ID

Ausgabe: „Buildchef <ID> — <Feature>. Danach freigegeben und baubar: <ID>, … (oder keins)"

| Zustand | Phase |
|---------|-------|
| offene Backend-Aufgaben im Plan | `/backend <ID> --auto` |
| offene Frontend-Aufgaben im Plan | `/frontend <ID> --auto` |
| alle Aufgaben erledigt, Status In Progress | `/qa <ID> --auto` |
| In Review, letzte QA-Runde NOT READY | Fix-Runde: `/backend` bzw. `/frontend <ID> --auto` mit dem Report aus `docs/qa/`, dann erneut `/qa <ID> --auto` (neuer QA-Agent) |
| In Review, letzte QA-Runde READY, noch keine Security-Zeile danach | `/security <ID> --auto` |
| In Review, letzte Security-Runde NICHT SICHER | Fix-Runde mit dem Security-Report, dann erneut `/security <ID> --auto` (neuer Security-Agent) |
| Approved | → **Feature-Ende** |

Spec ohne `## Plan` (älter angelegt): Routing nach Verlauf („Backend gebaut", „Frontend gebaut").

Daten vor UI und nacheinander statt parallel: das Frontend nutzt echte `lib/`-Funktionen statt Stubs, und es gibt nur eine Arbeitskopie.

### 🛑 Feature-Ende
Bei **Approved** oder einem harten Stopp: **Bericht** (unten), dann `AskUserQuestion`: „Nächstes Feature bauen?" — Optionen: **<nächste baubare ID> bauen** · **Stopp** (gibt es keins: nur der Bericht und „Nichts mehr freigegeben. Planen: `/planchef`.").

Nie ohne diese Antwort ins nächste Feature. Bei „bauen" nichts aus dem vorigen Feature mitnehmen — alles neu aus den Dateien lesen und `/buildchef <ID>` von vorn.

Der Bericht endet immer mit der kopierbaren Zeile für ein neues Fenster: `Nächstes: /buildchef <ID>` — oder `Nichts mehr freigegeben: /planchef <ID>`.

### Nach jeder Phase prüfen
- Status in INDEX und Spec-Header stimmen überein und haben sich wie erwartet bewegt; Plan-Tabelle abgehakt
- Die Phase ist committet (`git status --short` leer)
- Hat sich nach einem vollständigen Lauf **nichts** bewegt → harter Stopp mit Befund. Keine zweite Runde derselben Phase

## Abweichungen der Skills bei `--auto`

| Skill | statt Rückfrage | so |
|-------|-----------------|----|
| `/backend`, `/frontend` | Klären, Diff-Review mit User | Offenes mit der Empfehlung entscheiden und als **Annahme (Buildchef)** ins Decision Log; statt Diff-Review `/code-review` über die Phase — Critical/High beheben, bevor committet wird |
| `/qa`, `/security` | Fix-Runde starten? | Automatisch Fix-Runde, jedes Mal mit neuem Agenten |

Eine Annahme ist kein Stopp — sie steht im Decision Log und im Abschlussbericht.

## Harte Stopps

| Stopp | Warum |
|-------|-------|
| **Destruktive Migration** (Tabelle/Spalte weg, Typ verengen) | Modus lokal: die Datei auf dem Gerät ist die einzige Kopie der Daten |
| **Zweiter Fehlschlag an derselben Stelle** in `/qa` oder `/security` (Abbruchregel) | Entwurfsproblem — Vorschlag `/refine <ID>` |
| **Aufgabe der Ebene Du** (`U…`), die eine Folgeaufgabe blockiert | nur der User kann sie erledigen; nicht blockierende sammeln und am Ende nennen |
| Spec widerspricht dem Code · Phase bewegt nichts | Befund im Bericht |

## Nie automatisch
- `/deploy`, alles auf prod, EAS-Builds, `git push`
- `/refine`
- Ein nicht freigegebenes Feature bauen · ein zweites Feature ohne Antwort am Feature-Ende

## Bericht am Feature-Ende
Kurz, damit der User das Feature ansehen kann:
- **Ergebnis:** Approved, oder angehalten — wo, warum und der exakte Befehl zum Fortsetzen
- **Ansehen:** welche Screens im Dev-Client, wo erreichbar; was gebaut wurde in zwei Sätzen
- **Commits** je Aufgabe, **QA- und Security-Runden** mit gefundenen und behobenen Bugs, Ergebnis pro AC (Kurzform)
- **Annahmen (Buildchef)** — der User soll sie kennen
- **Offen:** „needs device check" aus `/qa`, nicht blockierende `U…`-Aufgaben, neue Einträge unter **Grenzen**

## Nicht tun
Selbst Code, Specs oder Designs schreiben (das machen die aufgerufenen Skills) · harte Stopps überspringen · Phasen parallel starten · Status setzen, ohne dass der zuständige Skill gelaufen ist · Rückfragen stellen · pushen
