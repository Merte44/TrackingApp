# TrackingApp — persönlicher Kalorien- & Nährwert-Tracker (on-device, Expo AI Starter Kit v3)

> Spec-getriebenes Template, um als Solo-Entwickler komplette native iOS-Apps **token-arm** zu bauen — mit Skills für Requirements, Architecture, Design, Frontend, Backend, Abnahme und Deployment. Deckt den ganzen Lebenszyklus ab: neue App, dev/prod-Betrieb, Releases.

## Tech Stack
- **Framework:** Expo SDK 54 (managed) + React Native, TypeScript · **Routing:** Expo Router (`app/`)
- **Styling:** NativeWind v4 + Tokens in `global.css` · **UI:** react-native-reusables als Basis-Primitives, eigene Kompositionen in `components/<domain>/`
- **Backend:** lokal — expo-sqlite on-device (kein Server) · **Fremddaten:** Open Food Facts (öffentliche API)
- **Validation:** Zod + react-hook-form · **State:** useState / Context · **Tests:** Jest (Unit + Migrations-Test)
- **Deploy:** EAS Build → Dev-Client → TestFlight → App Store · **Plattform:** iOS-first · **Sprache:** Deutsch, kein i18n

## Die 6 Ebenen
1. **Gedächtnis** — `docs/PRD.md`, `features/INDEX.md` (schlank), Specs mit Verlauf, `docs/RELEASES.md`, `docs/ENVIRONMENTS.md`, `docs/design-system.md`
2. **Rules** — `.claude/rules/` general / frontend / backend / security / design, path-scoped
3. **Skills** — `.claude/skills/` Workflow + gevendorte Expo-Skills
4. **Agents** — `.claude/agents/` Frontend/Backend-Ausführer (Worktree, MCP-dev), unabhängiger QA-Prüfer (frischer Kontext, read-only), Security-Tester (greift an, entscheidet selbst, ob er gebraucht wird)
5. **MCP** — `.mcp.json`: `supabase-dev`, `supabase-prod`, `expo` (Setup: `docs/MCP.md`)
6. **Design-Kopplung** — Repo ⇄ Claude Design; ein Screen pro Feature in `docs/design/screens/`

## Struktur
```
app/                 Expo Router Screens
components/ui/       reusables-Primitives (on demand)   components/<domain>/  eigene Kompositionen
hooks/  lib/         Hooks · db/ (SQLite + Migrationen), utils.ts, <feature>.ts (Data-Access)
features/            INDEX.md + PROJ-X-*.md
docs/                PRD, RELEASES, ENVIRONMENTS, NEW-PROJECT, RELEASE-CHECK, MCP, design-system.md, design/screens/, qa/
.claude/             rules/ skills/ agents/ settings.json      .mcp.json
```

## Workflow
`/init` → `/write-spec` → `/architecture` → `/frontend` ‖ `/backend` → `/qa` → `/deploy`
- **`/autopilot plan [PROJ-X]`** plant ein Feature mit Rückfragen bis zum Design-Paket (Screen-Entwurf als Link, ACs, Plan) und holt die Freigabe · **`/autopilot build [PROJ-X]`** baut ein freigegebenes Feature ohne Rückfragen bis Approved, meldet sich mit Bericht und dem Befehl fürs nächste; harte Stopps nur bei destruktiver Migration, zweitem QA-Fehlschlag am selben Ort, blockierender User-Aufgabe · `/autopilot PROJ-X` beides
- `/design tokens | sync | screen PROJ-X` · `/refine PROJ-X` · `/help` · `/ops` · `/check` · `/sync-template`
- Gevendorte Expo-Skills: `expo-deployment`, `upgrading-expo`, `native-data-fetching`, `eas-update-insights`

## Tracking
- `features/INDEX.md`: eine Zeile pro Feature, keine Historie; Status Roadmap → Planned → Architected → In Progress → In Review → Approved → Deployed
- **Deployed = im Release enthalten** (`docs/RELEASES.md`, Spalte Release). Verlauf pro Feature in der Spec unter **Verlauf**.
- Per-Env-Setup (Secrets, Crons, Auth-Templates, SMTP, Push) steht in `docs/ENVIRONMENTS.md`, nie nur im Chat.

## Konventionen
- Feature-IDs `PROJ-X` · Commits `type(PROJ-X): description` · ein Feature pro Spec · Acceptance Criteria `AC-n`: Angenommen / Wenn / Dann, Tests nennen die AC-ID (`features/README.md`)
- **Tokens, nie Hex** · **Touch statt Click** (`Pressable`, RN-Primitives) · SafeAreaView / KeyboardAvoidingView / FlatList
- Zod vor jedem DB-Schreibzugriff · Schema-Migrationen append-only, abgesichert durch den Migrations-Test (`.claude/rules/local-db.md`)
- **Human-in-the-loop** an jedem Checkpoint · Projektspezifika nur hier, in PRD und ENVIRONMENTS — nie in Skills/Rules

## Befehle
```bash
npx expo start --dev-client   # Metro für den Dev-Client
npx expo run:ios              # lokaler Dev-Client-Build im Simulator
npm test                      # Jest
npx tsc --noEmit              # Typecheck
eas build --platform ios --profile development|preview|production
```

## Product Context
@docs/PRD.md

## Feature Overview
@features/INDEX.md
