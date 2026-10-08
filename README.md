# Expo AI Starter Kit v3

> Spec-getriebenes Template, um als **Solo-Entwickler komplette native iOS-Apps token-arm zu bauen** — Expo + Supabase (dev/prod) + NativeWind/reusables, gesteuert über einen KI-Workflow aus spezialisierten Skills. Deckt den ganzen Lebenszyklus ab: neue App aufsetzen, dev/prod betreiben, Releases fahren.

Du arbeitest nie direkt im Code, sondern rufst **Skills** auf (Slash-Commands). Jeder Skill ist eine Rolle (Product Strategist, Architect, Frontend-Dev, Abnahme …), liest am Anfang `features/INDEX.md` + die Feature-Spec und schreibt am Ende den Status zurück. So bleibt der Kontext **im Repo statt im Chat** — das „token-arme" Prinzip.

---

## Inhalt

1. [Stack](#stack)
2. [Schnellstart](#schnellstart)
3. [Der Workflow](#der-workflow)
4. [Design-Kopplung](#design-kopplung)
5. [Das Fundament (Infrastruktur)](#das-fundament-infrastruktur)
6. [Die 6 Ebenen](#die-6-ebenen)
7. [Leitprinzipien](#leitprinzipien)
8. [Projektstruktur](#projektstruktur)
9. [Doku & Lizenz](#doku--lizenz)

---

## Stack

Expo SDK 54 · React Native 0.81 · React 19 · TypeScript · Expo Router 6 · **NativeWind v4 + react-native-reusables** · Supabase (PostgreSQL/Auth/Storage/Edge Functions, **zwei Projekte dev/prod**) · expo-secure-store · Zod + react-hook-form · Jest + Rollback-Proben · EAS → Dev-Client → TestFlight → App Store. **iOS-first, Deutsch, kein i18n.**

| Bereich | Wahl | Detail |
|---|---|---|
| Framework | Expo SDK 54, React Native 0.81, React 19 | New Architecture, React Compiler, Typed Routes |
| Routing | Expo Router 6 (file-based) | Screens in `app/` |
| Styling | NativeWind v4 + Tailwind v3 | bewusst *nicht* v5-preview |
| UI | react-native-reusables als Basis-Primitives | eigene Kompositionen in `components/<domain>/` erwünscht; nur Primitives nie duplizieren |
| Backend | Supabase, dev + prod | RLS auf jeder Tabelle; Migration dev → Advisors → Rollback-Probe → prod |
| Auth-Storage | expo-secure-store | verschlüsselt (Keychain / Keystore) |
| Validation | Zod + react-hook-form | |
| Tests | Jest (Unit) + Rollback-Proben in `supabase/tests/` | Abnahme über eingebaute Gates + Simulator-Walkthrough |
| Deploy | EAS Build → Dev-Client → TestFlight → App Store | Sammel-Releases in `docs/RELEASES.md` |
| Plattform | iOS-first (iPhone **+ iPad**) | Android bewusst später |

---

## Schnellstart

```bash
npm install
cp .env.local.example .env.local     # Supabase-Keys (dev) eintragen
npx expo run:ios                     # lokaler Dev-Client-Build im Simulator
npx expo start --dev-client          # Metro für den Dev-Client
```

Weitere Befehle:

```bash
npm test                              # Jest
npx tsc --noEmit                      # Typecheck
eas build --platform ios --profile development   # Dev-Client (Cloud) — Standard für QA + Release-Check
eas build --platform ios --profile preview       # TestFlight Internal
eas build --platform ios --profile production    # App Store
```

Eine **neue App** aus dem Template: Checkliste in [docs/NEW-PROJECT.md](docs/NEW-PROJECT.md) — `/init` arbeitet sie mit dir ab. MCP-Setup (Supabase dev/prod, Expo): [docs/MCP.md](docs/MCP.md).

---

## Der Workflow

### 1. Projekt aufsetzen (einmal pro Projekt)

| Weg | Befehl | Wann |
|-----|--------|------|
| **Mit Worten** | `/init <deine Idee>` | Du startest von einer Idee. |
| **Aus HTML-Mockup** | `/init docs/design/mockup.html` | Du hast die App als HTML entworfen — `/init` liest die Screens und leitet die Feature-Map ab. |
| **Aus Claude Design** | `/init <Projektname>` | Dein Design lebt in Claude Design; Screens kommen später pro Feature per `/design screen`. |

Alle Wege erzeugen `docs/PRD.md` + `features/INDEX.md`, legen `docs/ENVIRONMENTS.md` und `docs/RELEASES.md` an und führen per Interview durch die offenen Punkte (Backend ja/nein, Prioritäten, Non-Goals, Per-Env-Bedarf).

### 2. Design einrichten (einmal pro Projekt)

`/design tokens` — übersetzt die Design-Quelle in NativeWind-Tokens (`global.css` + `tailwind.config.js`), schreibt `docs/design-system.md` und bündelt die Fonts. Danach `/design sync`, damit Claude Design den Ist-Look kennt. Details unter [Design-Kopplung](#design-kopplung).

### 3. Feature für Feature bauen (die Pipeline)

| Skill | Rolle | Macht | Ergebnis |
|-------|-------|-------|----------|
| `/write-spec PROJ-X` | Product Manager | Feature-Spec interviewen | User Stories, Acceptance Criteria (dt.), Edge Cases, **Design** (Screen-Datei), **Umgebung**, Decision Log |
| `/architecture PROJ-X` | Architect | Technisches Design, kein Code | Komponentenbaum, Datenmodell, **Verträge** (lib-Funktionen, Tabellen, RPCs) → Frontend und Backend laufen parallel |
| `/frontend PROJ-X` | Frontend-Dev | UI aus `docs/design/screens/PROJ-X.html` | Screens/Kompositionen; ab 2 Screens Frontend-Agent im Worktree, Diff-Review |
| `/backend PROJ-X` | Backend-Dev | Supabase-Schicht auf dev | Migration + RLS, Rollback-Probe, `lib/<feature>.ts`, Jest; Backend-Agent mit dev-MCP |
| `/qa PROJ-X` | Abnahme | `/code-review` + `/security-review` über den Diff; ein **unabhängiger QA-Agent** (frischer Kontext, kennt den Build-Verlauf nicht) belegt jede AC per Test, Migrations-Test/Probe oder Dev-Client | READY / NOT READY, Bug-Routing an `/frontend` / `/backend` |
| `/deploy` | Release-Orchestrator | Sammel-Release: Release-Check per `/run`, prod-Migrationen verifizieren, EAS via `expo-deployment` | Eintrag in `docs/RELEASES.md`, alle enthaltenen Features → Deployed |

### Jederzeit-Helfer

- `/refine PROJ-X` — Spec überarbeiten, erweitern, hinterfragen (schreibt eine Verlauf-Zeile).
- `/help` — wo stehe ich, was kommt als Nächstes (liest INDEX, RELEASES, ENVIRONMENTS).
- `/ops` — Betriebs-Check dev/prod: Advisors, Crons, Edge-Function-Logs, Migrationsdrift; als `/schedule`-Routine nutzbar.
- `/check` — Skill-Selbstprüfung: tote Verweise, falsche MCP-Namen, Projektspezifika im generischen Teil.
- `/sync-template` — Bulk-Sync Template ⇄ App; Projektdateien werden nie überschrieben.

### Typischer Ablauf

```text
/init …  →  /design tokens  →  /design sync
   →  /write-spec PROJ-1  →  /architecture PROJ-1
   →  /design screen PROJ-1  →  /frontend PROJ-1 ‖ /backend PROJ-1
   →  /qa PROJ-1  →  (weitere Features)  →  /deploy
```

Jeder Schritt endet mit einem Handoff-Vorschlag — **Übergänge stößt immer du an, nie die KI automatisch.** Ein Release bündelt in der Regel mehrere Features; „Deployed" heißt „im Release enthalten".

---

## Design-Kopplung

Repo und Claude Design arbeiten in beide Richtungen zusammen:

```text
Repo (Tokens + components/)  ──/design sync──▶  Claude Design: Design-System-Projekt „<App>"
                                                      │
Claude Design: Screens entwerfen (im echten Look)     │
                                                      ▼
docs/design/screens/PROJ-X.html  ◀──/design screen PROJ-X──  Screen
        │
        ▼
/write-spec verlinkt · /frontend baut · /deploy zieht das Design-System nach
```

- **Repo ist Quelle für Tokens + Komponenten**, Claude Design ist Quelle für Screens. `docs/design/mockup.html` bleibt Archiv/Erstquelle für `/init` und `/design tokens`.
- **Eine Screen-Datei pro Feature** in `docs/design/screens/` — `/frontend` liest nur diese, nie das Gesamt-Mockup. Ohne Claude-Design-Projekt wird der Screen aus dem Mockup herausgelöst.
- Einmalig `/design-login`, dann `/design sync` nach jedem Release und jedem Re-Theme. Regeln: `.claude/rules/design.md`.

---

## Das Fundament (Infrastruktur)

Bevor irgendein Skill greift, ist das Repo eine echte, startbare Expo-App.

- `app/_layout.tsx` importiert `global.css` und rendert einen `<Stack />`; `app/index.tsx` ist ein neutraler Platzhalter. **Kein vorgebackenes Tab-/Auth-Gerüst** — das sind Pro-App-Entscheidungen, die der Workflow baut (PROJ-1 + erste Features).
- **Design-Token-System:** `global.css` (HSL-Tripel, `:root` + `.dark:root`, `--radius`) · `tailwind.config.js` (Klassen, `fontFamily`, `darkMode: 'class'`) · `components.json` + `lib/utils.ts` (`cn()`).
- **Backend-Fundament:** `lib/supabase.ts` (Client mit expo-secure-store-Adapter, Env-Guard) · `.env.local.example`.
- **On demand:** `components/ui/` (reusables via CLI), `components/<domain>/`, `hooks/`, `lib/<feature>.ts`, `supabase/migrations/`, `supabase/tests/`.

---

## Die 6 Ebenen

### Ebene 1 — Gedächtnis (Markdown = externalisierter Kontext)

| Datei | Rolle |
|---|---|
| `CLAUDE.md` | Projekt-Instruktionen, in jede Session geladen (importiert PRD + INDEX). |
| `docs/PRD.md` | Vision, Zielnutzer, Roadmap. Von `/init`. |
| `features/INDEX.md` | Single Source of Truth — **eine Zeile pro Feature**, Spalte Release, keine Historie. |
| `features/PROJ-X-*.md` | Spec mit Design, Umgebung, Tech Design + Verträge, **Verlauf** (1–3 Zeilen pro Ereignis). |
| `docs/RELEASES.md` | Ein Eintrag pro Build — Deployed = im Release enthalten. |
| `docs/ENVIRONMENTS.md` | dev/prod-Matrix: Refs, Secrets, Crons, Auth, SMTP, Push, EAS. Reproduzierbar statt Chat-Memory. |
| `docs/NEW-PROJECT.md` | Checkliste neue App inkl. Legal-Gates. |
| `docs/RELEASE-CHECK.md` | Die fünf Kernflows als Klickpfade für `/deploy`. |
| `docs/design-system.md` | Kanonische Design-Referenz von `/design tokens`. |
| `docs/MCP.md` | Setup der MCP-Server. |
| `BLUEPRINT.md` | Bau-Entscheidungen des Templates (v2 + v3). |

### Ebene 2 — Rules (path-scoped)

| Regel | Greift bei | Kernaussage |
|---|---|---|
| `general.md` | projektweit | Projekt-Erkennung, INDEX-Schlankheit, Release-Tracking, Projektspezifika nie in Skills, Write-Then-Verify, solo/team |
| `frontend.md` | `components/`, `app/`, `hooks/` | Primitives nicht duplizieren, Kompositionen erwünscht, Screen-Datei als Layout-Quelle, Tokens nie Hex |
| `backend.md` | `lib/`, `supabase/` | dev/prod-MCP, Migrations-Pfad, Rollback-Probe Pflicht, ENVIRONMENTS-Pflege |
| `security.md` | Secrets/Auth/Deep-Links | `/security-review` + Advisors als Gates, Edge-Function-Secrets pro Env |
| `design.md` | `docs/design/`, Token-Dateien | Quellen und Sync-Richtungen der Design-Kopplung |

### Ebene 3 — Skills

- **Workflow:** `init`, `write-spec`, `architecture`, `frontend`, `backend`, `qa`, `deploy`, `design`, `refine`, `help`, `ops`, `check`, `sync-template`.
- **Gevendort** aus [expo/skills](https://github.com/expo/skills) (MIT): `expo-deployment`, `upgrading-expo`, `native-data-fetching`, `eas-update-insights`.
- **Eingebaut, referenziert statt nachgebaut:** `/code-review`, `/security-review`, `/simplify`, `/run`, `/schedule`.

### Ebene 4 — Agents (Ausführer)

| Agent | Von | Macht |
|---|---|---|
| `frontend-dev.md` | `/frontend` (Standard ab 2 Screens) | baut Screens/Kompositionen im Worktree, liefert Diff + Zusammenfassung |
| `backend-dev.md` | `/backend` | Migration, Rollback-Probe, `lib/`, Jest — mit `mcp__supabase-dev__*`, nie prod |

Die Abnahme braucht keinen eigenen Agent: `/code-review` und `/security-review` sind eingebaut, der Walkthrough läuft inline über `/run`.

### Ebene 5 — MCP

`.mcp.json` mit drei Servern: **supabase-dev**, **supabase-prod** (beide mit Schreibzugriff, je fest auf ein Projekt gepinnt, Refs via `${SUPABASE_PROJECT_REF_DEV}` / `${SUPABASE_PROJECT_REF_PROD}`) und **expo**. dev/prod-Trennung über getrennte Server, nicht über eine Variable. Setup: [docs/MCP.md](docs/MCP.md).

### Ebene 6 — Design-Kopplung

Siehe [Design-Kopplung](#design-kopplung).

### CI

`.github/workflows/check.yml` — Typecheck + Jest bei jedem Push auf `main`. Kein PR-Zwang (Solo-Modus); Team-Modus schaltet Branches/PRs bewusst ein.

---

## Leitprinzipien

- **token-arm** — Kontext im Repo, nicht im Chat; INDEX schlank, Design pro Screen, Historie in Specs
- **Primitives nicht duplizieren** — reusables sind die Basis, eigene Kompositionen sind erwünscht
- **Tokens, nie Hex** — Farben/Fonts/Radien zuerst in die Token-Dateien (light + dark)
- **RLS first** — jede Tabelle abgesichert, Zod vor jedem DB-Call; dev → Advisors → Rollback-Probe → prod
- **Abnahme statt Prüfkatalog** — eingebaute Gates, Server-Beweis, Walkthrough im Dev-Client
- **Deployed = im Release enthalten** — Sammel-Deploys sind erste Klasse
- **Generisch statt lokalisiert** — Projektspezifika nur in CLAUDE.md, PRD, ENVIRONMENTS
- **iOS-first** · **Deutsch, kein i18n** · **Single Responsibility** · **Human-in-the-loop** · **Write-Then-Verify**
- **Commits:** `type(PROJ-X): description`

---

## Projektstruktur

```
app/                    Expo Router Screens (_layout.tsx, index.tsx)
components/ui/          reusables-Primitives (on demand)
components/<domain>/    eigene Kompositionen
hooks/                  Custom Hooks (on demand)
lib/                    supabase.ts, utils.ts, <feature>.ts (Data-Access)
supabase/               migrations/ · tests/ (Rollback-Proben) · functions/
features/               INDEX.md (schlank) + README + PROJ-X-*.md Specs
docs/                   PRD, RELEASES, ENVIRONMENTS, NEW-PROJECT, RELEASE-CHECK, MCP, design-system.md
docs/design/            mockup.html (Archiv) · screens/PROJ-X.html (eine Datei pro Feature)
docs/qa/                QA-Reports (nur bei Bugs) · docs/release-checks/ Screenshots
.claude/rules/          general, frontend, backend, security, design (path-scoped)
.claude/skills/         Workflow-Skills + gevendorte Expo-Skills
.claude/agents/         frontend-dev, backend-dev, qa
.claude/settings.json   Permissions (expo/eas/tsc/git/rsync/gh/idb …)
.github/workflows/      check.yml (Typecheck + Jest)
.mcp.json               supabase-dev, supabase-prod, expo
global.css              Design-Tokens (HSL, light + dark)
tailwind.config.js      Token→Klassen, fontFamily
components.json         reusables-Config
app.json                Expo App-Config
BLUEPRINT.md            Bau-Entscheidungen & Phasen
CLAUDE.md / AGENTS.md   KI-Instruktionen
```

---

## Doku & Lizenz

- **[CLAUDE.md](CLAUDE.md)** — Projekt-Instruktionen für die KI
- **[BLUEPRINT.md](BLUEPRINT.md)** — Bau-Entscheidungen v2 + v3, Phasen
- **[docs/NEW-PROJECT.md](docs/NEW-PROJECT.md)** — neue App aufsetzen
- **[docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)** — dev/prod-Matrix (Vorlage)
- **[docs/RELEASES.md](docs/RELEASES.md)** — Release-Log (Vorlage)
- **[docs/RELEASE-CHECK.md](docs/RELEASE-CHECK.md)** — Kernflows für den Release-Check (Vorlage)
- **[docs/MCP.md](docs/MCP.md)** — MCP-Setup (Supabase dev/prod, Expo, Design-Login)
- **[features/README.md](features/README.md)** — Aufbau & Konventionen der Feature-Specs

Die Skills `expo-deployment`, `upgrading-expo`, `native-data-fetching`, `eas-update-insights` stammen aus [expo/skills](https://github.com/expo/skills) (MIT) — siehe [.claude/skills/EXPO_SKILLS_NOTICE.md](.claude/skills/EXPO_SKILLS_NOTICE.md).
