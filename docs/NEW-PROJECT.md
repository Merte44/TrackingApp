# Neue App aufsetzen

> Checkliste vom Template-Klon bis zum ersten Feature. `/init` arbeitet sie mit dir ab und hakt sie hier ab.
> Reihenfolge ist Empfehlung; Abhängigkeiten sind markiert.

## 1. Identität (einmalig, danach nie mehr ändern)
- [ ] App-Name (Anzeigename) und Slug in `app.json`
- [ ] **Bundle-ID** (`ios.bundleIdentifier`) — bleibt für immer; Rename der App ändert sie NICHT
- [ ] Deep-Link-Schema (`scheme`) in `app.json`
- [ ] Icon + Splash in `assets/images/`

## 2. Repo
- [ ] Template geklont, `git remote` auf das neue Repo gesetzt
- [ ] `npm install`, `npx expo-doctor` grün
- [ ] `.env.local` aus `.env.local.example` angelegt (nie committen)

## 3. Supabase (dev + prod) — entfällt: on-device (`expo-sqlite`), siehe PRD
- [ ] Zwei Projekte anlegen: `<app>-dev` und `<app>-prod`
- [ ] Project-Refs in die Shell-Env (`SUPABASE_PROJECT_REF_DEV` / `_PROD`) — siehe `docs/MCP.md`
- [ ] `docs/ENVIRONMENTS.md` Matrix befüllen (Refs, Auth-URLs, SMTP-Entscheid)
- [ ] `/mcp` zeigt `supabase-dev` und `supabase-prod` verbunden

## 4. EAS + App Store Connect
- [ ] `eas init` (erzeugt `projectId`), `eas.json` mit `development` / `preview` / `production`
- [ ] Apple-Developer-Account, App in App Store Connect anlegen (gleiche Bundle-ID)
- [ ] `expo-dev-client` installiert; erster **Dev-Client-Build** (`eas build --profile development --platform ios`) — der Standard für QA und Release-Check
- [ ] EAS-Secrets gesetzt (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)

## 5. Design-Kopplung
- [ ] Erstquelle abgelegt: `docs/design/mockup.html` **oder** Claude-Design-Projekt benannt
- [ ] `/design tokens` gelaufen → `global.css`, `tailwind.config.js`, `docs/design-system.md`, Fonts gebündelt
- [ ] Einmalig `/design-login` (pro Mac), dann `/design sync` → legt das Design-System-Projekt in Claude Design an und trägt die projectId in `docs/ENVIRONMENTS.md` (Design-Kopplung) ein
- [ ] Screens-Projekt in Claude Design benannt und in `docs/ENVIRONMENTS.md` eingetragen

## 6. Gedächtnis
- [x] `docs/PRD.md` und `features/INDEX.md` durch `/init` gefüllt
- [x] `docs/RELEASES.md` und `docs/ENVIRONMENTS.md` angelegt (leer ist ok)
- [x] `CLAUDE.md` Kopf angepasst (App-Name, Kurzbeschreibung)

## 7. Legal-Gates (vor TestFlight External / App Store) — entfällt: private App, kein App Store
- [ ] Datenschutzerklärung (öffentliche URL) — Apple-Pflicht
- [ ] Impressum / Nutzungsbedingungen (öffentliche URL)
- [ ] App-Privacy-Angaben in App Store Connect aus dem Datenmodell abgeleitet (`/deploy` hilft)
- [ ] Account-Löschung in der App, wenn es Accounts gibt (Apple-Pflicht)

Danach: `/write-spec` für das erste Feature.
