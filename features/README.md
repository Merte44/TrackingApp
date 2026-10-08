# Feature-Specs

Zentrale Übersicht & Status: [`INDEX.md`](INDEX.md). Diese README erklärt Aufbau und Konventionen.

## Wofür dieser Ordner da ist

| Ort | Beantwortet |
|-----|-------------|
| [`INDEX.md`](INDEX.md) | Welche Features gibt es, in welchem Zustand, in welchem Release |
| [`MAPPING.md`](MAPPING.md) | Welche alte ID heute welche aktuelle ID ist (nur nach einer Umnummerierung) |
| `<ID>-*.md` | Was tut das Feature, wo liegt es im Code, welche Regeln gelten, was ist bewusst nicht drin |
| `docs/qa/`, `docs/RELEASES.md`, `git log` | Wie es dazu kam — **nicht** in der Spec |

**Eine Spec beschreibt den Ist-Zustand.** Gegenwartsform, Verweise statt Code, Ziel 80–150 Zeilen. Alles in Vergangenheitsform gehört in eine Zeile im Verlauf oder raus. Wird eine Spec deutlich länger, ist das Feature zu groß geschnitten.

**Der Titel sagt, wofür.** „Tipprunden-Einladungen & Beitritt", nicht „Einladungen" — man muss am Titel erkennen, ob die Spec das ist, was man sucht. **Dependencies nennen immer den Grund**, nicht nur die ID.

## Naming
`<ID>-feature-name.md` (kebab-case, sequenzielle ID; das Kürzel steht in `CLAUDE.md`).

## Aufbau einer Spec
Erzeugt von `/write-spec` aus [`.claude/skills/write-spec/template.md`](../.claude/skills/write-spec/template.md). Feste Reihenfolge:

| Abschnitt | Gepflegt von |
|-----------|--------------|
| Header (Status · Release · Bereich · Stand · Design), **Was es tut**, **Dependencies**, **Regeln**, **Acceptance Criteria**, **Grenzen**, **Umgebung** | `/write-spec`, `/refine` |
| **Screens & Komponenten**, **Daten & Server** (inkl. Verträge) | `/architecture` |
| **Tests** | `/frontend`, `/backend` |
| **Decision Log** | `/write-spec`, `/architecture`, `/refine` |
| **Verlauf** (eine Zeile pro Ereignis) | `/refine`, `/frontend`, `/backend`, `/qa`, `/deploy` |

**Acceptance Criteria** immer testbar, auf Deutsch, jede mit eigener ID:
```markdown
- [ ] **AC-1** Angenommen [Vorbedingung], wenn [Aktion], dann [Ergebnis]
```

### Nachverfolgbarkeit: AC-IDs
Jede Anforderung lässt sich von der Spec bis zum Prüfergebnis verfolgen: **AC → Test → QA-Ergebnis**. Die AC-ID ist das Bindeglied.

- **Vergabe:** fortlaufend pro Spec (`AC-1`, `AC-2` …). Neue ACs bekommen die nächste freie Nummer — auch nach dem Deploy
- **Stabil:** nie umnummerieren, nie wiederverwenden. Eine gestrichene AC hinterlässt eine Lücke. Ändert sich die **Bedeutung** einer AC (nicht nur die Formulierung), wird sie gestrichen und das Neue bekommt eine neue ID — sonst prüft ein alter Test stillschweigend etwas anderes
- **Zitieren** außerhalb der Spec: `<ID>/AC-n` (QA-Report, Commit, Verlauf)
- **Tests** nennen die ACs, die sie belegen, am Anfang des Testnamens; der `describe`-Block nennt die Feature-ID:
  ```ts
  describe("<ID> …", () => {
    it("AC-3: …", …)
    it("AC-7, AC-8: …", …)
  ```
  Tests ohne AC-Bezug (reine Technik, Regressionen) sind erlaubt. Eine AC, die kein automatischer Test belegen kann (Layout, Gerät), wird in der QA manuell belegt — mit Methode
- **Abdeckung prüfen:** `grep -rn "AC-[0-9]" --include="*.test.ts*" <Pfade des Features>`

### Lebenszyklus der Acceptance Criteria
Bis zur Abnahme sind die ACs **Checkboxen** — `/qa` arbeitet sie ab. Beim Deploy entfernt `/deploy` die Checkboxen, der Block **bleibt** als Prüfvertrag stehen: Die Tests verweisen dauerhaft auf ihn, und ein späterer `/refine` ergänzt ihn mit neuen IDs. Was die ACs als Ganzes sagen, steht zusätzlich verdichtet in `Regeln`.

### Was es nicht gibt
Keine datierten `Implementation Notes`-Blöcke, keine angehängten `Refinement`-Abschnitte, kein `Tech Design`-Block, keine `Open Questions` (offene Punkte stehen unter `Grenzen`), keine `User Stories`. Änderungen werden **in die bestehenden Abschnitte eingearbeitet**; dass etwas passiert ist, steht als eine Zeile im Verlauf.

## Status-Modell
Status steht im Spec-Header **und** in `INDEX.md` — beide müssen übereinstimmen.

| Status | erreicht nach |
|--------|---------------|
| Roadmap | `/init` |
| Planned | `/write-spec` |
| Architected | `/architecture` |
| In Progress | `/frontend` oder `/backend` |
| In Review | `/qa` startet |
| Approved | `/qa` READY |
| Deployed | im Release enthalten (`docs/RELEASES.md`, Spalte Release in INDEX) |

## Zusammengeführte Features
Geht ein Feature in einem anderen auf, bekommt die aufnehmende Spec eine Zeile **Entstanden aus** und einen Eintrag in [`MAPPING.md`](MAPPING.md). Eine eigene Datei bleibt nicht zurück — das Mapping trägt die Zuordnung.

Alte IDs werden **nie** neu vergeben. Wo eine alte ID weiterlebt (Git-Historie, QA-Berichte, Migrations-Dateinamen), bleibt sie unverändert stehen; `MAPPING.md` erklärt, welcher Bestand warum seine alten Nummern behält.

## Prüfung
`python3 scripts/check-spec-refs.py` liest jeden Datei-Verweis aus allen Specs und prüft, ob er existiert. Eine Spec, die eine Datei nennt, die es nicht gibt, schickt den nächsten Leser ins Leere — das fällt so sofort auf statt erst beim Suchen.

**Ein Pfad steht nur dann als Pfad da, wenn die Datei existiert.** Muss etwas Gelöschtes benannt werden — im Verlauf, als getragene Testlücke, als Begründung —, wird es im Satz benannt — die Datei in ein Backtick, ihr Ordner in ein zweites: `card.tsx` aus `components/<domain>/`, nie als durchgehender Pfad `components/<domain>/…`. Der Name bleibt lesbar, der Verweis verspricht nichts mehr.

Das ist kein Formalismus, sondern die Bedingung dafür, dass die Prüfung etwas taugt: Nie angelegte Entwurfsdateien und absichtliche Erwähnungen gelöschter Dateien halten sie sonst dauerhaft rot, ohne dass ein Fehler echt wäre. Ein Prüfer, der immer rot ist, fängt nichts mehr: Ein neuer Bruch erscheint dann nur als eine Zahl mehr.

## Wo Historie hingehört
- **Spec → Verlauf:** eine Zeile pro Ereignis (Refine, QA-Verdikt, Release) mit Link
- **`docs/qa/<ID>-qa-YYYY-MM-DD.md`:** QA-Report, nur wenn Bugs gefunden wurden
- **`docs/RELEASES.md`:** was in welchem Build live ging
- **`git log --grep="<ID>"`:** Implementierungsdetails — Features von vor einer Umnummerierung tragen dort noch ihre **alte** ID (siehe [`MAPPING.md`](MAPPING.md))
- **Nie in `INDEX.md`**
