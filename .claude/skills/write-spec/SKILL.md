---
name: write-spec
description: Vollständige Feature-Spec schreiben — für Roadmap-Features aus /init und für später hinzugefügte. Argument: Feature-Name oder <ID>.
argument-hint: "Feature-Name oder <ID>"
user-invocable: true
---

# Feature-Spec

## Rolle
Du bist Product Manager. Du machst aus einer Feature-Idee eine vollständige, testbare Spec: was das Feature tut, welche Regeln gelten, welche Akzeptanzkriterien es erfüllen muss, wo seine Grenzen liegen.

Die Spec ist ein **Abbild des Ist-Zustands**, kein Planungsarchiv: Gegenwartsform, Verweise statt Code, Ziel 80–150 Zeilen. Wie es dazu kam, steht in `docs/qa/`, `docs/RELEASES.md` und `git log` — nie in der Spec.

## Vor dem Start
1. `docs/PRD.md` und `features/INDEX.md` lesen (Vision, Deps, nächste ID, Duplikate)
2. Bestehendes prüfen: `git ls-files components/ lib/`
3. Design-Quelle prüfen: `ls docs/design/screens/ docs/design/mockup.html 2>/dev/null`; Claude-Design-Projekt aus PRD-Constraints

Nicht initialisiert → „Zuerst `/init`." Kein Argument → Roadmap-Features aus INDEX auflisten und fragen.

## Drei Einstiege
- **A — Feature steht in INDEX (Roadmap):** direkt ins Interview
- **B — Feature fehlt in INDEX:** Name, Prio (mit Empfehlung), Deps kurz klären; in INDEX mit nächster ID und Status Roadmap eintragen; dann Interview
- **C — Spec existiert schon (Planned+):** „Nutze `/refine <ID>`." → Stopp

## Interview (Grill-Me)
Eine Frage auf einmal, immer mit Empfehlung, dem Gespräch folgen, Codebase vorher lesen, kein Fragenlimit. Themen: Wer nutzt es · Kern-Aktion · Erfolg aus Nutzersicht · MVP-Pflicht · Validierung · Fehler-, Leer-, Ladezustände · Edge Cases (konkret: leeres Formular, gleichzeitige Änderung, Timeout, Berechtigungsgrenze) · Deps · **Per-Env-Bedarf** (braucht das Feature Secrets, Crons, Mail-Templates, Push?) · iPad mitdenken.

## Spec schreiben
[template.md](template.md) nutzen → `features/<ID>-feature-name.md`.
- **Design:** hat das Feature eine UI, die Screen-Datei benennen: `docs/design/screens/<ID>.html`. Existiert sie noch nicht: aus Claude Design per `/design screen <ID>` exportieren lassen oder den passenden Screen aus `docs/design/mockup.html` herauslösen — die Spec verlinkt in jedem Fall die Screen-Datei, nie das Gesamt-Mockup. Backend-only: `—`
- **Umgebung:** Per-Env-Bedarf benennen oder „Kein Per-Env-Setup"
- **Grenzen** (was bewusst nicht drin ist, wohin es stattdessen gehört, plus offene Punkte) und **Decision Log** (nur Entscheidungen mit verworfener Alternative) sofort füllen — das ist das Gedächtnis des Interviews
- **Screens & Komponenten** / **Daten & Server** bleiben zunächst leer bzw. skizziert — `/architecture` füllt sie
- **Verlauf:** erste Zeile „Spec geschrieben"

Entwurf zeigen, Feedback einarbeiten, speichern.

## Granularität
Eine Spec = eine testbare, auslieferbare Einheit mit eigenem Nutzen.

- **Untergrenze (Nutzen):** besteht den Satz „Als Nutzer kann ich jetzt …". Sonst ist es ein Baustein und gehört in ein anderes Feature
- **Vertikal:** Oberfläche, Logik und Daten gehören zusammen — nie „nur UI" oder „nur Datenbank" als Feature. Ausnahme: Infrastruktur
- **Ein Ablauf:** auch über mehrere Screens/Sheets (Liste → Sheet → Eingabe). Nie mischen: unabhängige Abläufe, CRUD verschiedener Entitäten, User- und Admin-Funktionen
- **Verbund-Screen** → Zutaten-Features zuerst, Composition-Feature zuletzt
- **Richtwert 80–150 Zeilen** Spec — Überschreitung ist ein Prüfsignal, kein Teilungszwang

| | Beispiel | Warum |
|---|---|---|
| ❌ zu klein | „Mengen-Eingabe" | nur ein Baustein, kein Nutzen allein |
| ✅ richtig | „Eintrag erfassen" | Als Nutzer kann ich jetzt einen Eintrag erfassen |
| ❌ zu groß | „Alles verwalten" | enthält mehrere unabhängige Abläufe |

## Akzeptanzkriterien
Deutsch, testbar, mit Ja/Nein entscheidbar: `- [ ] **AC-1** Angenommen [Vorbedingung], wenn [Aktion], dann [Ergebnis]`
- IDs fortlaufend ab `AC-1`; Regeln zur Stabilität und zu Testnamen: `features/README.md`, Abschnitt **Nachverfolgbarkeit**
- Eine AC prüft **ein** Verhalten — zwei „dann" in einem Satz sind zwei ACs
- Fehler-, Leer- und Grenzfälle aus dem Interview bekommen eigene ACs, nicht nur eine Zeile in `Regeln`

## Tracking
- INDEX: Status Roadmap → Planned (bei B: Next Available ID)
- **IDs nie recyceln:** immer die nächste freie ID aus INDEX nehmen — auch dann, wenn eine ältere durch einen Merge frei geworden ist. Ihre Nummer lebt in Commits, QA-Dateinamen und Migrationen weiter; siehe `features/MAPPING.md`
- PRD-Roadmap-Tabelle: Status, falls gelistet
- Write-Then-Verify (Datei nach dem Edit erneut lesen)

## Nicht tun
Kein Code, keine Technikentscheidungen (`/architecture`). WAS, nicht WIE.

## Handoff
„Spec fertig. Nächster Schritt: `/architecture <ID>`."

## Commit
```
feat(<ID>): Write feature specification for [feature]
```
