# Agent Guide

Dieses Repo ist ein **Expo SDK 54 / React Native** Template (v3). Stack, Struktur, Workflow und Konventionen stehen in **`CLAUDE.md`** — dort zuerst lesen.

- **Expo ändert sich schnell.** Vor dem Schreiben von Code die versionierten Docs prüfen: <https://docs.expo.dev/versions/v54.0.0/>
- **Sechs Ebenen:** Gedächtnis (`docs/`, `features/`) · Rules (`.claude/rules/`) · Skills (`.claude/skills/`) · Agents (`.claude/agents/`) · MCP (`.mcp.json`, dev/prod) · Design-Kopplung (`docs/design/screens/`)
- **Workflow-Skills:** `init` `write-spec` `architecture` `frontend` `backend` `qa` `deploy` · `design` (tokens / sync / screen) · `refine` `help` `ops` `check` `sync-template`
- **Kernregeln:** Tokens statt Hex · Primitives nicht duplizieren · RLS auf jeder Tabelle, Migration dev → Advisors → Rollback-Probe → prod · Deployed = im Release enthalten · Deutsch, kein i18n · Human-in-the-loop
- Projektspezifika nur in `CLAUDE.md`, `docs/PRD.md`, `docs/ENVIRONMENTS.md` — nie in Skills/Rules.
