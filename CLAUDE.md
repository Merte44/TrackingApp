# TrackingApp — persönlicher Kalorien- & Nährwert-Tracker (on-device, Expo AI Starter Kit v3)

> Spec-getriebenes Template, um als Solo-Entwickler komplette native iOS-Apps **token-arm** zu bauen — mit Skills für Requirements, Architecture, Design, Frontend, Backend, Abnahme und Deployment. Deckt den ganzen Lebenszyklus ab: neue App, dev/prod-Betrieb, Releases.

## Tech Stack
- **Framework:** Expo SDK 54 (managed) + React Native, TypeScript · **Routing:** Expo Router (`app/`)
- **Styling:** NativeWind v4 + Tokens in `global.css` · **UI:** react-native-reusables als Basis-Primitives, eigene Kompositionen in `components/<domain>/`
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions), zwei Projekte **dev/prod** · **Auth-Storage:** expo-secure-store
- **Validation:** Zod + react-hook-form · **State:** useState / Context · **Tests:** Jest (Unit) + Rollback-Proben (`supabase/tests/`)
- **Deploy:** EAS Build → Dev-Client → TestFlight → App Store · **Plattform:** iOS-first · **Sprache:** Deutsch, kein i18n

## Die 6 Ebenen
1. **Gedächtnis** — `docs/PRD.md`, `features/INDEX.md` (schlank), Specs mit Verlauf, `docs/RELEASES.md`, `docs/ENVIRONMENTS.md`, `docs/design-system.md`
2. **Rules** — `.claude/rules/` general / frontend / backend / security / design, path-scoped
3. **Skills** — `.claude/skills/` Workflow + gevendorte Expo-Skills
4. **Agents** — `.claude/agents/` Frontend/Backend-Ausführer (Worktree, MCP-dev)
5. **MCP** — `.mcp.json`: `supabase-dev`, `supabase-prod`, `expo` (Setup: `docs/MCP.md`)
6. **Design-Kopplung** — Repo ⇄ Claude Design; ein Screen pro Feature in `docs/design/screens/`

## Struktur
```
app/                 Expo Router Screens
components/ui/       reusables-Primitives (on demand)   components/<domain>/  eigene Kompositionen
hooks/  lib/         Hooks · supabase.ts, utils.ts, <feature>.ts (Data-Access)
supabase/            migrations/ (versioniert) · tests/ (Rollback-Proben) · functions/
features/            INDEX.md + PROJ-X-*.md
docs/                PRD, RELEASES, ENVIRONMENTS, NEW-PROJECT, RELEASE-CHECK, MCP, design-system.md, design/screens/, qa/
.claude/             rules/ skills/ agents/ settings.json      .mcp.json
```

## Workflow
`/init` → `/write-spec` → `/architecture` → `/frontend` ‖ `/backend` → `/qa` → `/deploy`
- `/design tokens | sync | screen PROJ-X` · `/refine PROJ-X` · `/help` · `/ops` · `/check` · `/sync-template`
- Gevendorte Expo-Skills: `expo-deployment`, `upgrading-expo`, `native-data-fetching`, `eas-update-insights`

## Tracking
- `features/INDEX.md`: eine Zeile pro Feature, keine Historie; Status Roadmap → Planned → Architected → In Progress → In Review → Approved → Deployed
- **Deployed = im Release enthalten** (`docs/RELEASES.md`, Spalte Release). Verlauf pro Feature in der Spec unter **Verlauf**.
- Per-Env-Setup (Secrets, Crons, Auth-Templates, SMTP, Push) steht in `docs/ENVIRONMENTS.md`, nie nur im Chat.

## Konventionen
- Feature-IDs `PROJ-X` · Commits `type(PROJ-X): description` · ein Feature pro Spec · Acceptance Criteria: Angenommen / Wenn / Dann
- **Tokens, nie Hex** · **Touch statt Click** (`Pressable`, RN-Primitives) · SafeAreaView / KeyboardAvoidingView / FlatList
- **RLS first**, Zod vor jedem DB-Call · Migration dev → Advisors → Rollback-Probe → prod
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
