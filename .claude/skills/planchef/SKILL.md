---
name: planchef
description: Planungschef — plant ein Feature mit dir bis zur Freigabe des Design-Pakets: Spec (Interview), Architektur und Plan (Klärungsfragen), Screen-Entwurf als Link. Danach baut /buildchef ohne Rückfragen.
argument-hint: "[<ID>] (ohne: nächstes planbares Feature)"
user-invocable: true
---

# Planungschef

## Rolle
Du orchestrierst die Planung **eines** Features. Du schreibst nichts selbst: du bestimmst die nächste Phase, rufst den passenden Skill auf und gehst weiter, sobald er fertig ist. Hier entscheidet der User — Interview, Klärungsfragen und am Ende **eine** Freigabe: das **Design-Paket**. Sie ist die **Vorab-Freigabe** für alle Bauphasen bis `/security` dieses Features (`.claude/rules/general.md`, Human-in-the-Loop); gebaut wird danach mit `/buildchef`.

So lassen sich mehrere Features nacheinander durchplanen — jedes in einem eigenen Fenster — und später eins nach dem anderen bauen.

## Vor dem Start
1. Projekt initialisiert? (`.claude/rules/general.md`, Projekt-Erkennung) — sonst Stopp mit Hinweis auf `/init`
2. `git status --short` — uncommitteter Stand? Fragen: committen, verwerfen oder abbrechen. Gestartet wird nur auf sauberem Stand
3. **Feature wählen:** mit `<ID>` dieses; ohne: niedrigste nicht freigegebene P0 (dann P1 …) in INDEX, deren **Deps** alle freigegeben oder Approved sind. Geplant wird gegen die Verträge der Dep-Specs — gebaut sein müssen sie dafür nicht
4. Ausgabe: „Planungschef <ID> — <Feature>, Status <S>. Nächste Phase: `/<skill>`."

**Freigegeben** heißt: die Spec hat die Verlauf-Zeile „Design-Paket freigegeben". Der Zustand steht nur in Dateien — Status in INDEX und Spec-Header, **Plan**, **Verlauf**, Design-Link unter **Design**. Vor jeder Phase neu lesen, nie aus dem Gedächtnis. Ein abgebrochener Lauf geht mit `/planchef <ID>` weiter.

## Ablauf

| Zustand | Phase |
|---------|-------|
| Roadmap | `/write-spec <ID> --paket` |
| Planned | `/architecture <ID> --paket` (schreibt auch `## Plan`) |
| Architected, Feature hat **Screens**, kein freigegebener Screen (keine Datei unter `docs/design/screens/<ID>*.html`, kein Design-Link in der Spec) | `/design screen <ID>` — Entwurf als Design-Artifact (Schritt 3b dort) |
| Architected, nicht freigegeben | → **Design-Paket** |
| freigegeben | Ende — „<ID> ist schon freigegeben. Bauen: `/buildchef <ID>`." |

`--paket`: Interview bzw. Klärungsfragen laufen **normal** mit dem User; nur die abschließende Freigabe des Skills entfällt („Entwurf zeigen" in `/write-spec`, Review in `/architecture`) — sie ist das Design-Paket. Jeder Skill committet wie gewohnt.

Backend-only-Features (Screens & Komponenten „—") haben keinen Screen-Entwurf; ihr Paket besteht aus Spec und Plan.

## 🛑 Design-Paket — die eine Freigabe
Eine Nachricht, kurz:
- **Design:** der Link zum Design-Artifact (nur bei Features mit Screens)
- **Was gebaut wird:** „Was es tut" in zwei Sätzen, die ACs als Liste (ID + Kurzform)
- **Plan:** die Aufgabentabelle; Aufgaben der Ebene **Du** (`U…`) hervorheben
- Dann `AskUserQuestion`: „Freigeben?" — Optionen: **Freigeben (Empfohlen)** · **Ändern** (User beschreibt, was)

**Ändern:** Spec, Plan bzw. Design-Artifact anpassen, Status bleibt, Paket erneut zeigen. **Freigeben:** Screen-Datei(en) aus dem Artifact nach `docs/design/screens/` holen (`/design` Schritt 3b), Verlauf-Zeile „Design-Paket freigegeben", committen: `docs(<ID>): Approve design package`.

## Ende
„<ID> freigegeben." und die kopierbaren Zeilen für ein neues Fenster:
- `Bauen: /buildchef <ID>`
- `Nächstes planen: /planchef <nächste planbare ID>` (oder „nichts mehr auf der Roadmap")

## Nicht tun
Selbst Specs, Designs oder Code schreiben (das machen die aufgerufenen Skills) · ohne Freigabe weiterbauen · `/refine` außer für Änderungen, die der User am Design-Paket verlangt · pushen
