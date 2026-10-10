---
name: deploy
description: Sammel-Release fahren — Gates (tsc/lint/Jest + Klick gegen prod bzw. Upgrade-Gate), prod-Migrationen verifizieren (Modus supabase), EAS-Build/Submit via expo-deployment, RELEASES-Eintrag, alle enthaltenen Features → Deployed, Design-System nachziehen.
argument-hint: "'testflight' | 'appstore' | 'dev-client' (optional: <ID>, wenn nur ein Feature)"
user-invocable: true
---

# Deploy (Release-Orchestrator)

## Rolle
Du fährst ein **Release** — in der Regel mehrere Approved-Features, Refines und Fixes in einem Build. Die EAS-Mechanik (Build, Submit, `eas.json`, Credentials) liefert der Skill `expo-deployment`; hier steht nur der Workflow drumherum.

## Vor dem Start
1. `features/INDEX.md`: alle **Approved** Features + Refines/Fixes seit dem letzten Release (`docs/RELEASES.md`, `git log`) auflisten → das ist der Release-Inhalt; mit dem User bestätigen
2. `docs/ENVIRONMENTS.md`: offene prod-Häkchen der enthaltenen Features = Vorbereitungsliste
3. Tier wählen: **Dev-Client** (`development`) · **TestFlight Internal** (`preview`) · **TestFlight External** · **App Store**

## Release-Gate
```bash
npx tsc --noEmit && npm run lint && npm test
git status --short   # muss leer sein
```
- **Gerätedurchgang — die offenen „needs device check" aus `/qa`:** `/qa` kann Push, Mail-Links, Deep-Links und Haptik im Simulator nicht beweisen und sammelt sie als offene Punkte. Hier werden sie abgearbeitet, **einmal pro Release auf einem echten Gerät** statt einmal pro Feature. In diesem Projekt saßen genau dort die teuersten Fehler (fehlende Push-Abfrage beim Einladen, kaputte Mail-Deep-Links)
- **Modus lokal — Upgrade-Gate statt Klick gegen prod:** den neuen Build **über** den zuletzt installierten installieren (nicht frisch), App starten: vorhandene Daten sind noch da, eine Kernfunktion auslösen (z. B. Eintrag speichern). Hier fällt eine kaputte Migration auf — auf dem Gerät gibt es keinen Server, der die Daten zurückholt
- **Modus supabase — ein echter Klick gegen prod:** Anmelden mit dem Demo-Account aus `docs/ENVIRONMENTS.md` und eine Kernfunktion auslösen (z. B. Datensatz öffnen, Eintrag speichern). Das ist der Gate, der in der Praxis Fehler gefunden hat — ein abgelaufener Schlüssel oder eine fehlende prod-Migration fällt hier auf, nicht im Typecheck
- **Optionaler Tiefen-Durchlauf:** bei einem Release mit viel UI die betroffenen Screens per `/run` im Dev-Client durchgehen, Screenshots nach `docs/release-checks/<version>-build<N>/`. Kein Pflicht-Gate — ein vollständiger Klickpfad-Katalog wurde in sieben Releases kein einziges Mal gefahren und am 2026-09-21 deshalb abgeschafft. Fehlschlag = Bug → Routing wie in `/qa`, kein Build
- **`/security release`** (jedes Tier): Security-Agent über alles seit dem letzten Release-Tag — Zusammenspiel der Features und Lieferkette, die einzelne Feature-Prüfungen nicht sehen. NICHT SICHER = kein Build, Routing wie dort
- **Vor External / App Store zusätzlich:** `/security-review` über den ganzen Branch (in `/security release` enthalten, wenn es dort lief) + (Modus supabase) `mcp__supabase-prod__get_advisors`; Legal-Gates aus `docs/NEW-PROJECT.md` §7 (Datenschutz-URL, Impressum, Account-Löschung, App-Privacy-Angaben aus dem Datenmodell ableiten und in App Store Connect eintragen); Monitoring-Gates aus `docs/NEW-PROJECT.md` §8 / `.claude/rules/monitoring.md` (Crash-Monitoring verifiziert, Rate-Limits gesetzt, Advisors performance sauber) — Modus lokal und Tier Dev-Client/Internal: entfällt

## Backend auf prod (nur Modus supabase)
Modus lokal: entfällt — Migrationen laufen beim App-Start auf dem Gerät und sind durch Migrations-Test und Upgrade-Gate abgesichert.

1. Fehlende Migrationen in Reihenfolge: `mcp__supabase-prod__apply_migration` (Datei aus `supabase/migrations/`); DEFINER/RLS/Edge Function → vorher `/security-review`; destruktive Ops bestätigen lassen
2. `mcp__supabase-prod__get_advisors` — keine neue Warnung
3. Rollback-Proben der enthaltenen Features auf prod fahren — nur solche, die am selben Tag auf dev `REGRESSION_PASS` lieferten und **keine** externen Nebenwirkungen anstoßen (`DEV_ONLY`-Proben auslassen; Regeln in `.claude/rules/backend.md`)
4. **Verifikation:** `mcp__supabase-prod__list_migrations` gegen `ls supabase/migrations/` — jede Repo-Migration muss auf prod sein, bevor gebaut wird
5. Per-Env-Setup nachziehen (Secrets, Crons, Edge Functions, Auth-Templates) und in ENVIRONMENTS prod abhaken
6. Breaking-Migrationen (Spaltenentzug, RPC-Signatur) **erst nach** dem Submit anwenden, wenn der alte Build sie nicht verträgt — mit dem User abstimmen

## Build & Submit
- `version` in `app.json` bumpen (semver); Build-Nummer vergibt EAS (`appVersionSource: remote`, nicht hand-editieren)
- Kommandos, Profile, Credentials, Submit: **`expo-deployment`** (`references/testflight.md`, `ios-app-store.md`)
- EAS-Secrets: nur `EXPO_PUBLIC_*`; nie Service-Role-Key
- **OTA (EAS Update) nur, wenn `expo-updates` installiert ist** (`grep expo-updates package.json`). Sonst braucht jede Code-Änderung einen neuen Build — das hier so festhalten, nicht OTA versprechen. Mit `expo-updates`: JS-only-Fixes per `eas update`, native Änderungen (Modul, Permission, `app.json`) per Build

## Nach dem Build
- `docs/RELEASES.md`: Eintrag nach Vorlage (Version/Build, Datum, Tier, Enthalten, prod-Migrationen, Release-Check, offene Gerätetests)
- Jedes enthaltene Feature: INDEX Status → **Deployed**, Spalte **Release** = Build; Spec **Verlauf**-Zeile (Write-Then-Verify)
- **AC-Block abschließen:** Checkboxen entfernen (`- [x] **AC-n**` → `- **AC-n**`), IDs und Text bleiben — die Tests verweisen dauerhaft darauf (`features/README.md`, Nachverfolgbarkeit). Steht eine abgenommene Regel noch nicht in `Regeln`, dort verdichtet ergänzen
- Tag: `git tag -a v<X.Y.Z>-build<N> -m "Release <N>"`; push
- Offene Gerätetests (Push, Deep-Links) auf dem TestFlight-Gerät durchführen und im RELEASES-Eintrag schließen
- **Design-System nachziehen:** `/design sync` (Repo → Claude Design), damit neue Screens im Ist-Look entworfen werden

## Rollback
Native Bruch in TestFlight → vorherigen Build installieren. App Store → fixen, neuer Build. Mit `expo-updates`: `eas update:republish`. Immer: Ursache lokal fixen → `/qa` → neues Release.

## Handoff
„Release vN ist in <Tier>. Enthalten: … Offen: <Gerätetests>. Nächster Schritt: Gerätetests abschließen oder nächstes Feature."

## Commit
```
deploy: v<X.Y.Z> / Build <N> → <Tier> (<ID>, <ID2>, …)
```
