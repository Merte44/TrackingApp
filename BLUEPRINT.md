# Template Blueprint — Expo AI Starter Kit v2

> **Eine Quelle der Wahrheit** für den Neuaufbau. Jede Entscheidung steht hier.
> Erstellt: 2026-06-14 · Methode: „Neu + Gold retten" (sauber neu, Bewährtes portiert).
> Vorgänger: `~/Developer/expo-starter-kit` (Next.js→Expo-Adaption, diente als Lernfeld).

---

## 1. Zweck & Zielgruppe

Ein **spec-getriebenes AI-Entwicklungs-Template für native iOS-Apps** (Expo + Supabase),
das einen Solo-Entwickler durch eine feste Pipeline führt:
`init → write-spec → architecture → frontend → backend → qa → deploy`.

**Nutzer:** Solo-Entwickler, **lernend** im Stack (Expo/RN/Supabase neu, programmiert aber
sicher). Mac + Apple Developer Program + TestFlight. Kommunikation & App-UI auf **Deutsch**.

**Konsequenz fürs Template:** Skills erklären, zeigen vollständige Befehle, warnen vor
typischen Fehlern. Kein „für-Experten-knapp". Stack-Spezifisches gründlich.

---

## 2. Stack-Entscheidungen (festgezurrt)

| Bereich | Entscheidung |
|---|---|
| Framework | Expo (managed) + React Native + TypeScript |
| Routing | Expo Router (file-based, `app/`) |
| Styling | **NativeWind v4 + Tailwind v3** (bewusst NICHT v5-preview) |
| UI-Komponenten | **react-native-reusables** (shadcn-Philosophie, copy-paste) |
| Backend | Supabase (PostgreSQL + Auth + Storage), optional |
| Auth-Storage | expo-secure-store (verschlüsselt) |
| Validation | Zod + react-hook-form |
| State | useState / Context (react-query optionales Upgrade) |
| Tests | Jest (Default-Gate); Maestro E2E dokumentiert, aber optional/später |
| Deploy | EAS Build → TestFlight → App Store |
| Plattform | **iOS-first** (iPhone + iPad), Android bewusst später |
| Sprache | Deutsch, **kein i18n** |

---

## 3. Die 5 Ebenen — Zielzustand

### Ebene 1 — MD-Dateien (Gedächtnis)
- `CLAUDE.md` (Stack, Struktur, Konventionen) — **ohne** Next.js-Adaptions-Altlast.
- `docs/PRD.md`, `features/INDEX.md` — Template-Struktur wie gehabt (gut).
- `docs/design-system.md` — kanonische Design-Referenz (siehe §4).
- `docs/MCP.md` — wie man die MCP-Server einrichtet (siehe §5).
- **Kein** `ADAPTATION.md`, **keine** Web-only Production-Docs.

### Ebene 2 — Rules (Grenzen)
Portiert & gereinigt: `frontend.md`, `backend.md`, `security.md`, `general.md`.
- Pfade korrekt: `components/`, `app/`, `lib/` — **kein `src/`**, **kein `app/api/`**.
- Deutsch-/kein-i18n-Konvention ergänzt.
- Design-Token-Regel ergänzt: „nutze Tokens, niemals Hex hardcoden".

### Ebene 3 — Skills (Workflows)
Portiert & gereinigt: `init`, `write-spec`, `architecture`, `frontend`, `backend`,
`qa`, `deploy`, `refine`, `help`, plus Tooling-Skills.
- **Gold bleibt:** QA-Maestro-Gotchas, Tiered-Test-Strategie, Grill-Me-Prinzip,
  Single-Responsibility, Decision-Log/Open-Questions.
- **Neu:** `/design`-Skill (siehe §4).
- src/-Pfade in allen Skills gefixt.

### Ebene 4 — Subagents
Neu auf Expo geschrieben (frontend-dev, backend-dev, qa-engineer) **und in die Skills
verdrahtet**, sodass sie wirklich gespawnt werden (für isolierte/parallele Arbeit).
Keine Next.js/shadcn/Browser-Reste mehr.

### Ebene 5 — MCP
Committbares `.mcp.json` im Repo:
- **Supabase-MCP** — Schema/SQL/Tabellen direkt aus Claude (macht „preferred" im Backend-Skill wahr).
- **Expo-MCP** (`https://mcp.expo.dev/mcp`) — EAS-/Projekt-Infos.
Secrets via Env-Platzhalter, nie committed. `docs/MCP.md` erklärt das Setup.

---

## 4. Design-Ebene (Token-Pipeline)

**Prinzip:** Das HTML-Mockup (aus Claude/Cloud-Design) ist die *Quelle*, nicht das
Design-System. RN shippt kein HTML/CSS — es wird in **Tokens übersetzt**.

Drei Orte:
1. `global.css` — Farb-Tokens als HSL-Vars (`:root` Light + `.dark:root` Dark).
2. `tailwind.config.js` — verdrahtet Vars als Klassen; Fonts hier.
3. `docs/design-system.md` — menschenlesbare Referenz, die `/frontend` liest.

**Neuer `/design`-Skill, zwei Jobs:**
- **Theme-Bootstrap (einmal/Projekt):** Mockup → Palette/Typo/Radius → schreibt die drei Orte.
- **Screen-Referenz (pro Feature):** `/frontend` liest das Mockup als visuelle Vorlage.

**Ehrliche Grenzen:** HTML→RN ist nie pixelgenau (Web kann Grid/Hover etc.); Skill
übersetzt Absicht. Fonts müssen via `expo-font` gebündelt werden, nicht nur benannt.

---

## 5. Expo-Skills-Integration — „Weg A: Rosinen + MCP"

Quelle: github.com/expo/skills (offiziell, MIT). Fundament (reusables/NativeWind v4)
bleibt. Nur nicht-konfliktäre Teile rein:

**Reinholen (ins Repo kopiert, MIT-Attribution):**
- `expo-deployment`, `upgrading-expo`, `native-data-fetching`, `eas-update-insights`
- Deren `references/` ersetzen die alten Web-Production-Docs.
- Expo-MCP (siehe §5/Ebene 5).

**Bewusst DRAUSSEN (kollidieren mit reusables):**
- `building-native-ui` („kein Tailwind, inline styles"; „nie SafeAreaView")
- `expo-tailwind-setup` (NativeWind v5-preview + react-native-css nightly)
- `expo-ui`, `use-dom`

**Weg B** (auf Expo-native/NativeWind-v5 umsteigen) = bewusstes späteres Projekt, nicht jetzt.

---

## 6. Scaffold — was das Template mitbringt

- **Fundament behalten, Demo-Inhalt nicht.** Lauffähige Expo-SDK-54-Basis
  (NativeWind v4, reusables-Setup, Expo Router) mit einem neutralen `app/index.tsx`.
- **Kein** Demo-CRUD (das löscht man eh pro Projekt raus).
- **Kein vorgebackenes Auth-/Nav-Gerüst** (Entscheidung in Phase 6 revidiert):
  Navigation & Auth-Methode sind per-App-Entscheidungen, die der Workflow baut
  (PROJ-1 „Supabase Infrastructure Setup" + erste Features). Ein fixes Scaffold
  würde den Workflow duplizieren und vorentscheiden.
- `lib/supabase.ts` mit expo-secure-store-Adapter (einmal-Setup).

---

## 7. Vom alten Template: Gold vs. Cruft

**Gerettet (Gold):**
- Skills-Inhalte (v.a. QA-Maestro-Gotchas), Rules, Workflow-Architektur, Feature-Tracking.
- Bewährte Config: NativeWind-v4-Setup, tailwind.config, global.css, babel, metro,
  components.json, tsconfig-Aliases, eslint.

**Gedroppt (Cruft):**
- Tote Subagents (Next.js/Web) → neu.
- stale `src/`-Pfade in general.md/write-spec/architecture/help.
- settings.json-Permissions, die nicht zum Stack passen (npm run dev/build, shadcn).
- `ADAPTATION.md`, `EXPO_ADAPTATION_GUIDE.md`, Next.js-Adaptions-Abschnitt in CLAUDE.md.
- Web-only Production-Docs (error-tracking/security-headers in Next.js-Form).

---

## 8. Konventionen

- Feature-IDs: `PROJ-1, PROJ-2, …` (sequenziell)
- Commits: `type(PROJ-X): description` (feat/fix/refactor/test/docs/deploy/chore)
- Acceptance Criteria: Deutsch, `Angenommen … / Wenn … / Dann …`
- Single Responsibility: ein Feature pro Spec.
- Testing: Jest als Default-Gate; Maestro erst bei echten Flows.
- settings.json: `expo`, `maestro`, `eas`, `npx tsc` erlauben (nicht npm run dev/build/shadcn).

---

## 9. Bau-Phasen

- [x] **Phase 0** — Blueprint + Ordner + GitHub-Repo
- [x] **Phase 1** — Expo SDK 54 Fundament: bewährte Config portiert (NativeWind v4, tailwind, babel/metro, reusables/components.json, tsconfig @/*). Verifiziert: tsc sauber, expo-doctor 18/18.
- [x] **Phase 2** — Skills + Rules + Workflow + Tracking gereinigt portiert (ohne kaputte Subagents). Gefixt: src/-Pfade→components//lib/, shadcn→reusables, localStorage→AsyncStorage, Browser-Support→Plattformen, Vercel/localhost-URLs, Next.js-Adaptions-Note raus, frische settings.json (expo/maestro/eas/tsc), Design-Token-Regel in frontend.md ergänzt. Offen für Phase 6: deploy-Skill Production-Doc-Tabelle.
- [x] **Phase 3** — MCP-Ebene: committbares `.mcp.json` (Supabase via stdio + `--read-only` Default + Env-Platzhalter `${SUPABASE_ACCESS_TOKEN}`/`${SUPABASE_PROJECT_REF}`; Expo via HTTP `mcp.expo.dev`). `docs/MCP.md` mit Setup (Token/Project-Ref, read-only↔write-Toggle, Sicherheit). Keine Secrets im Repo.
- [x] **Phase 4** — `/design`-Skill gebaut (HTML-Mockup → NativeWind-Tokens in global.css/tailwind.config + docs/design-system.md, hex→HSL, Font-Bundling via expo-font, Buildability-Check 🔴/🟡/✅). `/init` übergibt die Token-Übersetzung jetzt an `/design` statt selbst zu schreiben. **Hinweis:** die echte Token-Extraktion (z.B. FriendBet) ist per-Projekt, NICHT im Template — das Template liefert nur den Skill.
- [x] **Phase 5** — Subagents (frontend-dev/backend-dev/qa-engineer) Expo-korrekt neu als **Ausführer-Modell** (Skills dirigieren interaktiv, Subagents führen abgegrenzte autonome Brocken aus) + dezente „Delegation (optional)"-Notizen in /frontend, /backend, /qa. (Vorgezogen — im Ur-Plan Teil von Phase 6.)
- [x] **Phase 6** — Schlankes Supabase-Fundament (Weg A): `lib/supabase.ts` (Client + expo-secure-store-Adapter, Env-Guard, 2048-Byte-Caveat) + `.env.local.example`. **Bewusst KEIN** Auth-/Nav-Scaffold — Navigation & Auth-Methode sind per-App-Entscheidungen, die der Workflow baut (PROJ-1 „Supabase Infrastructure Setup" + erste Features). Vorgebackenes Gerüst würde den Workflow duplizieren & vorentscheiden.
- [x] **Phase 7** — Expo-Rosinen (4 Skills + references gevendort, MIT-Attribution in EXPO_SKILLS_NOTICE.md). `/deploy` neu als **dünner Orchestrator** (QA-Gate, Tiers, Tracking, Supabase-Specifics) der die EAS-Mechanik an `expo-deployment` delegiert. backend-Dangling-Refs → Inline-Performance/Rate-Limit-Notiz. Finale CLAUDE.md (token-tight, ohne Next.js-Altlast) + README + AGENTS.md. **Template fertig.**

---

## 10. Offene Punkte (Input nötig)

- [ ] **HTML-Mockup** des Designs → für Phase 4 (`docs/design/mockup.html`).
- [ ] **Supabase Project-Ref / Token-Handling** → für Phase 3 (`.mcp.json`).
- [ ] Bundle-ID-Schema bestätigen (z.B. `com.merte44.<app>`).

---

# v3 (2026-09-15) — Workflow-Refactor

> Anlass: Wiedereinstieg nach dem ersten kompletten MVP mit v2 (30 Features, zehn TestFlight-Builds).
> Weg: **Template zuerst, dann Bulk-Sync in die App.** Die Blueprint-v3-Planung ist hier eingearbeitet.

## v3.0 Was v2 gelehrt hat

**Hat funktioniert (bleibt):** Pipeline-Reihenfolge, Grill-Me-Interviews, Spec-Template mit Out-of-Scope + Decision-Log, path-scoped Rules, Token-Pipeline aus dem Mockup, dev/prod als getrennte MCP-Server, Rollback-Proben in `supabase/tests/`, QA fährt den Simulator selbst + Ehrlichkeitsregel + Bug-Routing, QA-Reports in eigener Datei, gevendorte Expo-Skills.

**Hat nicht funktioniert (geändert):**
1. `features/INDEX.md` wurde zum Changelog (22 KB, in jeder Session geladen) → nicht mehr token-arm.
2. Status „Deployed" pro Feature passte nicht zu Sammel-Deploys (viele Features „Approved", obwohl live).
3. Per-Umgebung-Setup (Vault, EF-Secrets, Crons, SMTP, Push) stand nur im Chat-Memory.
4. Subagents waren nie ein Team: kein MCP-Zugriff, falsche Server-Namen, Delegation „optional".
5. Reusables-Regel und Realität divergierten (wenige Reusables, viele eigene Komponenten).
6. Design war eine Einbahnstraße: ein großer Monolith, bei jedem Frontend-Lauf komplett gelesen, kein Rückweg für neue Screens.
7. Veraltete Aussagen in Skills (Read-only-Flag im MCP, OTA ohne `expo-updates`, nicht existenter Security-Skill).
8. Kein Sicherheitsnetz vor Querschnitts-Umbauten; uncommitteter Code lag Monate.
9. QA war ein Prüfkatalog mit viel Text und wenig Wirkung.

## v3.1 Ziele

- **Mehr-App-Prinzip:** kompletter Lebenszyklus — neue App aufsetzen, dev/prod betreiben, Releases fahren — ohne Wissen im Chat-Memory.
- **dev/prod explizit:** jede Umgebung dokumentiert und reproduzierbar (`docs/ENVIRONMENTS.md`).
- **Design-Kopplung:** Claude Design ↔ Claude Code in beide Richtungen.
- **Echtes Agent-Team:** Frontend/Backend als Ausführer mit Werkzeugzugang; der Mensch bleibt Reviewer.
- **Token-arm wieder wahr:** Index schlank, Design pro Screen, Historie in Specs.
- **Generisch statt lokalisiert:** keine Projektspezifika in Skills/Rules — nur in `CLAUDE.md`, `ENVIRONMENTS`, `PRD`. Bulk-Sync ist damit verlustfrei.

## v3.2 Ist-Zustand der Ebenen

| Ebene | v3 |
|---|---|
| **1 Gedächtnis** | INDEX eine Zeile pro Feature + Spalte Release; Spec-Template mit Design (Screen-Datei), Umgebung, Verlauf; neu `docs/RELEASES.md` (Deployed = im Release enthalten), `docs/ENVIRONMENTS.md` (dev/prod-Matrix + Checkliste neue Umgebung), `docs/NEW-PROJECT.md` (Checkliste inkl. Legal-Gates), `docs/RELEASE-CHECK.md` (fünf Kernflows); `docs/design/screens/PROJ-X.html` eine Datei pro Feature; CLAUDE.md kurz |
| **2 Rules** | general (INDEX-Schlankheit, Release-Tracking, Projektspezifika-Regel, solo/team), frontend (Primitives nicht duplizieren, Kompositionen erwünscht, Screen-Datei als Layout-Quelle), backend (dev/prod-MCP, Migrations-Pfad, Rollback-Probe Pflicht mit RAISE-/prod-/DEV_ONLY-Regeln, ENVIRONMENTS), security (`/security-review` + Advisors als Gates, EF-Secrets pro Env), neu design (Sync-Richtungen) |
| **3 Skills** | alle zehn Workflow-Skills Deutsch und schlank; `qa` als Abnahme (§v3.3); `deploy` als Sammel-Release mit Release-Check, prod-Verifikation, OTA nur mit `expo-updates`; `design` mit Modi tokens / sync / screen; neu `sync-template`, `ops`, `check`; keine Checklisten-Dateien, keine Maestro-Dateien |
| **4 Agents** | `frontend-dev` (Worktree, maxTurns 80, Diff + Zusammenfassung), `backend-dev` (dev-MCP-Werkzeuge einzeln, nie prod, Rollback-Probe im Auftrag); QA-Agent entfernt — Gates sind eingebaut. CI: `.github/workflows/check.yml` (Typecheck + Jest, Push auf main, `--passWithNoTests`) |
| **5 MCP** | `.mcp.json` als dev/prod-Paar mit `${SUPABASE_PROJECT_REF_DEV}` / `_PROD`, ohne Read-only-Flag; `docs/MCP.md` generisch |
| **6 Design-Kopplung** | Repo → Claude Design per `/design sync` (DesignSync), Claude Design → Repo per `/design screen PROJ-X`; Details nach `/design-login` zu verifizieren |

## v3.3 QA-Konzept — Abnahme statt Prüfkatalog

Wert geliefert hatten in v2 nur der Simulator-Walkthrough mit Screenshots, die Rollback-Proben und das Bug-Routing. v3 reduziert QA auf vier Schritte:

| Schritt | Werkzeug | Was |
|---|---|---|
| 1 Code-Gate | `/code-review <basis>..HEAD` | Korrektheit des Diffs (explizites Ziel, da die Arbeitskopie nach den Commits leer ist) |
| 2 Security-Gate | `/security-review <basis>..HEAD` | Secrets, Auth, Input, RLS-Auswirkungen — ersetzt den Red-Team-Katalog |
| 3 Server-Beweis | Rollback-Probe `supabase/tests/` | nur bei RPC-/RLS-/Trigger-Änderungen |
| 4 Abnahme | `/run` + Simulator (Dev-Client) | jedes AC einmal durchspielen, Screenshot als Beleg |

READY, wenn Gates ohne Critical/High, Probe grün, alle ACs belegt. Sonst Bug-Routing an `/frontend` / `/backend`; Report nur bei Bugs. **Rausgeflogen:** Maestro als Gate, Edge-Case-Jagdliste, Red-Team-Katalog, Secret-Grep, QA-Agent, Langform-Vorlage. **Release-Check** (fünf Kernflows per `/run`, `docs/RELEASE-CHECK.md`) ersetzt die Smoke-Suite. **Dev-Client** statt Expo Go als Standard. Tiefer Security-Audit einmal pro Release vor External / App Store, nicht pro Feature.

## v3.4 Phasen

- [x] **A — Gedächtnis + Rules:** INDEX-Format, Spec-Template, RELEASES/ENVIRONMENTS/NEW-PROJECT/RELEASE-CHECK, CLAUDE.md, Rules inkl. `design.md`.
- [x] **B — Skills:** alle Workflow-Skills überarbeitet, `qa` als Abnahme, `sync-template` + `ops` + `check` neu, `design` in drei Modi.
- [x] **C — Agents + MCP + CI:** Agents auf v3, QA-Agent entfernt, `.mcp.json`-Paar, `docs/MCP.md` generisch, GitHub-Action.
- [ ] **D — Design-Kopplung:** nach einmaligem `/design-login` Export-Format und Screen-Rückweg verifizieren, `design`-Skill und `design.md` finalisieren.
- [ ] **E — Bulk-Sync in die erste App:** `/sync-template from-template`; INDEX schrumpfen (Historie in Specs), RELEASES rückwirkend befüllen, ENVIRONMENTS aus Ist-Zustand befüllen, RELEASE-CHECK mit den fünf Kernflows, Dev-Client-Build, Memory-Pruning.
- [x] **F — README/BLUEPRINT:** README auf v3, dieses Kapitel, Plan-Datei eingearbeitet.
- [ ] **G — Nachlauf:** Drift-Routine per `/schedule` (Template vs. Apps), Legal-Vorbereitung im Deploy-Skill verfeinern, Expo-SDK-Upgrade-Rhythmus im Template.
