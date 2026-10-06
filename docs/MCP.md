# MCP-Server (Ebene 5)

Das Template bringt drei **MCP-Server** mit — über [`.mcp.json`](../.mcp.json) im Repo-Root. MCP („Model Context Protocol") lässt Claude **direkt** mit externen Systemen reden, statt nur Code zu schreiben.

| Server | Wozu |
|--------|------|
| **supabase-dev** | Schema inspizieren, SQL ausführen, Migrationen anwenden, Advisors, Logs — gegen das **dev-Projekt**. Der tägliche Arbeits-Server; einziger Server, den die Agents bekommen. |
| **supabase-prod** | Dasselbe gegen das **prod-Projekt**. Bewusst getrennter Server, damit prod nie aus Versehen getroffen wird — nur explizit für reviewte Migrationen in `/deploy` und für `/ops`. |
| **expo** | EAS-Builds, Update-Insights, Projekt-Infos (offizieller HTTP-MCP, kein Setup). |

> **Kein Secret im Repo.** `.mcp.json` enthält nur `${...}`-Platzhalter. Werte kommen aus deiner Shell-Umgebung.

> **Posture:** Beide Supabase-Server haben **Schreibzugriff** (kein `--read-only`), jeder per `--project-ref` fest auf genau ein Projekt gepinnt. dev/prod-Trennung läuft über **getrennte Server**, nicht über das Umschalten einer Variable. Arbeitsregel: immer zuerst dev, dann Advisors, dann Rollback-Probe, dann prod (`.claude/rules/backend.md`). Destruktive Ops auf prod werden immer vorher bestätigt.

---

## Supabase-MCP einrichten

### 1. Access-Token
[supabase.com/dashboard](https://supabase.com/dashboard) → Account → **Access Tokens** → **Generate new token**. Wird nur einmal angezeigt.

### 2. Project-Refs (beide Projekte)
Pro Projekt: **Project Settings → General → Reference ID**. Du brauchst zwei: dev und prod. Beide auch in `docs/ENVIRONMENTS.md` eintragen.

### 3. Env-Variablen
In die **Shell-Umgebung** (`~/.zshrc` oder pro Projekt via `direnv`), nicht in die App-`.env`:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxx"   # account-weit, deckt beide Projekte ab
export SUPABASE_PROJECT_REF_DEV="dev-reference-id"
export SUPABASE_PROJECT_REF_PROD="prod-reference-id"
```

Neues Terminal (oder `source ~/.zshrc`) **und Claude Code neu starten**, damit die Server die Variablen sehen.

### 4. Verifizieren
`/mcp` in Claude Code (oder `claude mcp list`). Sind `supabase-dev` / `supabase-prod` rot, fehlt meist eine Variable oder das Token ist abgelaufen.

---

## Expo-MCP
Nichts einzurichten — HTTP-MCP unter `https://mcp.expo.dev/mcp`. Beim ersten Zugriff Login/Consent im Browser.

## Design-Kopplung (Ebene 6)
Kein MCP-Server, aber ein einmaliges Login: `/design-login` verbindet Claude Code mit Claude Design. Danach funktionieren `/design sync` (Repo → Design-System-Projekt) und `/design screen <ID>` (Screen → `docs/design/screens/`). Details: `.claude/rules/design.md`.

## Sicherheit
- `SUPABASE_ACCESS_TOKEN` ist persönlich und mächtig — wie ein Passwort behandeln, nie committen, nie loggen
- Quelle der Wahrheit bleibt die versionierte Migration in `supabase/migrations/`, auch wenn sie per MCP angewandt wird
- Service-Role-Keys gehören hier nicht hin — nur in Edge-Function-Secrets

> Das Supabase-MCP-Paket und seine Flags ändern sich gelegentlich: https://supabase.com/docs/guides/getting-started/mcp
