# Allgemeine Projektregeln

> **Stack:** Expo / React Native (siehe `CLAUDE.md`). iOS-first, NativeWind v4 + react-native-reusables, Supabase dev/prod. Deutsch, kein i18n.

## Projekt-Erkennung (PFLICHT)
Vor jeder Arbeit prüfen, ob das Projekt initialisiert ist:
1. `docs/PRD.md` — enthält es noch Platzhalter wie „_Describe what you are building_", ist das Projekt NICHT initialisiert
2. `features/INDEX.md` — leere Tabelle = keine Features definiert

**Nicht initialisiert:** keinen Code schreiben, nicht vorgreifen. Sagen: „Dieses Projekt ist noch nicht aufgesetzt. Starte mit `/init <Idee>` oder `/init docs/design/mockup.html`." Hat der User seine Idee schon beschrieben, `/init` direkt damit starten.

**Initialisiert, aber Feature fehlt in INDEX.md:** erst `/write-spec`, dann Implementierung.

## Feature-Tracking
- `features/INDEX.md` ist die Single Source of Truth — vor jeder Arbeit lesen
- **Schlankheitsregel:** eine Zeile pro Feature, Beschreibung ≤ 120 Zeichen, **keine Historie** in INDEX. Verlauf gehört in die Spec (Sektion **Verlauf**, 1–3 Zeilen pro Ereignis mit Link), Reports nach `docs/qa/`, Releases nach `docs/RELEASES.md`
- Specs: `features/<ID>-feature-name.md` — das Kürzel des Projekts steht in `CLAUDE.md`; IDs sequenziell (nächste freie ID in INDEX), alte IDs werden nie neu vergeben
- Ein Feature pro Spec (Single Responsibility); nie unabhängige Abläufe in einer Spec bündeln
- **Feature-Definition:** eine testbare, auslieferbare Einheit mit eigenem Nutzen („Als Nutzer kann ich jetzt …"), vertikal geschnitten (Oberfläche, Logik, Daten), genau ein Ablauf — auch über mehrere Screens. Ohne eigenen Nutzen ist es ein Baustein eines anderen Features. Einzige Ausnahme: Infrastruktur-Features

## Release-Tracking (Sammel-Deploys sind Normalfall)
- **Deployed = im Release enthalten.** Ein Feature wird erst „Deployed", wenn `docs/RELEASES.md` einen Build nennt, der es enthält; die Spalte **Release** in INDEX trägt diesen Build
- Bis dahin bleibt ein QA-bestandenes Feature **Approved** — auch wenn seine Backend-Migration schon auf prod liegt. Das ist gewollt, kein Versäumnis; nicht zum Deployen drängen
- Per-Umgebung-Setup (Secrets, Crons, Auth-Templates, SMTP, Push) steht in `docs/ENVIRONMENTS.md` — nie nur im Chat oder Memory

## Projektspezifika
- Skills, Rules, Agents und Template-Docs sind **generisch**: kein App-Name, keine Project-Refs, keine Feature-IDs als Beispiele aus einer konkreten App
- Projektspezifika leben nur in `CLAUDE.md`, `docs/PRD.md`, `docs/ENVIRONMENTS.md` und den Specs. Nur so bleibt `/sync-template` verlustfrei

## Git
- Commit-Format `type(<ID>): description` — Typen: feat, fix, refactor, test, docs, deploy, chore
- Vor Neuem prüfen: `ls features/`, `git ls-files components/`, `git ls-files lib/`
- **Solo-Modus (Default):** direkt auf `main`, keine Branches/PRs. **Team-Modus:** Feature-Branches + PRs — wird bewusst umgeschaltet, wenn ein zweiter Mitarbeiter dazukommt
- Uncommitteter Stand liegt nie länger als einen Arbeitstag: am Ende jeder Session committen

## Human-in-the-Loop
- Vor dem Finalisieren eines Deliverables Freigabe einholen; Optionen als klare Auswahl anbieten
- Nie ohne Bestätigung in die nächste Workflow-Phase. Die Bestätigung kann **vorab im Auftrag** stehen („danach /backend …", „bis QA durchziehen"): dann den Handoff kurz nennen und ohne Rückfrage weitermachen. Fehlt sie, ist der Handoff ein Vorschlag („Nächster Schritt: /<skill> …"), nie automatisch
- Eine Vorab-Freigabe deckt nur die genannten Phasen ab und endet an jedem Checkpoint mit eigener Freigabe (Architektur-Review, prod-Migration, Deploy/Submit) — dort wird trotzdem gefragt

## Status-Updates (Write-Then-Verify)
1. Spec und `features/INDEX.md` **lesen** vor dem Editieren
2. Änderung mit dem Edit-Tool **schreiben** — nicht nur beschreiben
3. Datei danach **erneut lesen** und die Änderung bestätigen; fehlt sie, Schritt 2 wiederholen

Was aktualisiert wird: Status im Spec-Header und in INDEX (müssen übereinstimmen), Verlauf-Zeile in der Spec, bei Env-Bedarf `docs/ENVIRONMENTS.md`. Nie „habe aktualisiert" sagen, ohne das Edit-Tool aufgerufen zu haben.

## Dateien
- Immer lesen vor dem Ändern; nach Kontext-Kompaktierung erneut lesen
- Bei Unsicherheit über den Projektstand zuerst `features/INDEX.md`, dann `git diff`
- Import-Pfade, Komponenten- und Funktionsnamen nie raten — nachlesen
