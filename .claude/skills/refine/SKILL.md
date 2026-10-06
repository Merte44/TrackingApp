---
name: refine
description: Immer nutzen, wenn der User über ein bestehendes Feature oder seine Spec sprechen will — verbessern, erweitern, grundsätzlich hinterfragen. Prüft zu Beginn, ob die Spec noch der Wirklichkeit entspricht. Argument <ID>.
argument-hint: "<ID>"
user-invocable: true
---

# Spec-Refine

## Rolle
Du bist Product Manager mit einer lebenden Spec. Du verbesserst, erweiterst oder hinterfragst sie anhand dessen, was der User mitbringt.

## Vor dem Start
Spec `features/<ID>-*.md`, `features/INDEX.md`, `docs/PRD.md` lesen. Kein Argument → Features aus INDEX auflisten. Unbekannte ID → sagen und auflisten.

## Zuerst: stimmt die Spec überhaupt noch? (5 Minuten, immer)

Bevor du über Änderungen redest, halte die Spec kurz gegen die Wirklichkeit. Bei einem `Deployed`-Feature gibt es keinen AC-Block mehr, den jemand abarbeitet — **danach prüft nichts mehr nach, ob das Beschriebene noch zutrifft.** Genau dort sammeln sich die Unwahrheiten.

Drei Handgriffe, mehr nicht:
1. **Zahlen und Namen stichprobenartig nachschlagen** statt glauben: genannte Tabellen, RPCs, Trigger und Konstanten gegen `mcp__supabase-dev__*` bzw. den Code. Eine erfundene Konstante ist schneller gefunden als erklärt
2. **Grenzen durchgehen:** Steht dort noch etwas als offen, das längst erledigt ist? Raus damit — eine abgehakte Grenze führt den nächsten Leser in die Irre
3. **Testangaben prüfen**, falls die Spec Zahlen nennt (`npx jest <datei>`)

Gefundene Abweichungen **sofort in die Spec einarbeiten** und als eigene Verlauf-Zeile führen — getrennt von dem, was der User eigentlich wollte. Findest du dabei einen echten Fehler im Code, ist das ein Bug und gehört an `/frontend` bzw. `/backend`, nicht in diesen Lauf.

## Eröffnungsfrage (immer)
> „Was bringt dich zurück zu dieser Spec?"

## Drei Pfade
- **1 — Etwas hat sich geändert** (Scope, Nutzerfeedback, Regeln): gezieltes Interview nur zu den betroffenen Stellen — was ändert sich an **Was es tut**, **Regeln**, **Dependencies**, **Grenzen** (und an den ACs, falls das Feature noch nicht Deployed ist)?
- **2 — Umsetzung hat Lücken gezeigt:** fehlendes Szenario → neues AC oder Edge Case; verwandte Lücken gleich mit schließen
- **3 — Grundsätzliche Infragestellung:** Annahme prüfen, Split/Merge erwägen, Minimalversion finden. Split → neue Spec über den `/write-spec`-Ablauf, INDEX anpassen

**Stirbt dabei eine ID (Merge), bekommt sie eine Nachsendeadresse.** Sonst zeigen Commits, QA-Berichte und Migrations-Dateinamen auf eine ID, die es nirgends mehr gibt:
- aufnehmende Spec: Zeile **Entstanden aus:** unter dem Header, mit den alten IDs
- `features/MAPPING.md`: Zeile `neu | Feature | vorher` (Datei anlegen, falls es sie noch nicht gibt)
- INDEX: alte Zeile raus; die ID wird **nie** neu vergeben
- keine Stub-Datei zurücklassen — das Mapping trägt die Zuordnung an einer Stelle

Grill-Me wie in `/write-spec`: eine Frage, Empfehlung, Codebase vorher lesen.

**Wachsende Features:** führt der Refine einen eigenständigen Deploy-Kandidaten ein, eine **eigene Spec** vorschlagen statt die bestehende aufzublähen.

## Spec aktualisieren
- Änderungen **in die bestehenden Abschnitte einarbeiten** — nie einen datierten Refine-Block anhängen. Die Spec bleibt Gegenwartsform; dass refined wurde, steht als **eine** Verlauf-Zeile: `YYYY-MM-DD | Refine: <Grund> | <was sich änderte>`
- Erledigte Punkte aus **Grenzen** entfernen, neue dort ergänzen; Entscheidungen mit verworfener Alternative ins **Decision Log**
- Ist das Feature schon `Deployed`, gibt es keinen AC-Block mehr: der Refine ändert `Regeln`. Muss neu abgenommen werden, legt er einen AC-Block nur für das Geänderte an
- Ändert sich die UI: Screen-Datei in **Design** prüfen — neuer Export per `/design screen <ID>` nötig?
- Ändert sich Per-Env-Bedarf: **Umgebung** + `docs/ENVIRONMENTS.md`
- Datei nach dem Edit erneut lesen (Write-Then-Verify)

## Tracking
INDEX nur, wenn Status oder Deps sich ändern (keine Historie in INDEX). PRD, wenn die Roadmap betroffen ist. Ein Refine an einem gebauten Feature setzt den Status zurück auf den Schritt, der neu gemacht werden muss (z. B. Approved → Architected).

## Handoff
Pfad 1/2: „Spec aktualisiert. Weiter mit dem nächsten Schritt: `/architecture` bzw. `/frontend` / `/backend`."
Pfad 3 (Split): „Neue Spec <ID2> angelegt. `/architecture <ID2>`."

## Commit
```
docs(<ID>): Refine feature specification — [Grund]
```
