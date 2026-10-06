# Umgebungen (dev / prod)

> Jede Umgebung ist hier dokumentiert und damit reproduzierbar. Was hier fehlt, existiert für den Workflow nicht.
> **Regel:** Jedes Feature, das Per-Umgebung-Setup braucht (Sektion **Umgebung** in der Spec), trägt sich hier ein —
> spätestens in `/backend`, verifiziert in `/deploy`. Keine Secret-Werte, nur Namen und Fundorte.

## Matrix

| Bereich | dev | prod |
|---------|-----|------|
| **Supabase-Projekt** | entfällt — kein Backend, Daten on-device (`expo-sqlite`), siehe PRD → Constraints | entfällt |
| **MCP-Server** | `supabase-*` ungenutzt (zeigen per `~/.zshrc` auf eine andere App — nicht verwenden) | ungenutzt |
| **Externe API** | Open Food Facts (öffentlich, kein Key) | Open Food Facts |
| **Migrationsstand** | `supabase/migrations/` = Repo | Repo-Liste vs. `list_migrations` vor jedem Submit prüfen |
| **Vault-Secrets** | — | — |
| **Edge Functions + Secrets** | — | — |
| **Crons (pg_cron)** | — | — |
| **Auth: Site URL / Redirect URLs** | `exp://…`, `<schema>://` | `<schema>://`, `https://<domain>` |
| **Auth: Mail-Templates** | Default | angepasst? (Confirm / Reset / Magic Link) |
| **Auth: SMTP** | Supabase-Default | Custom-SMTP (Anbieter, Absender) |
| **Auth: Password Policy / Rate Limits** | — | — |
| **Push (APNs-Key / Expo-Credentials)** | — | — |
| **EAS-Secrets (`EXPO_PUBLIC_*`)** | `.env.local` | `eas env:list` |
| **EAS-Projekt / Build-Profile** | `development` | `preview` / `production` |
| **App Store Connect** | — | App-ID, Bundle-ID, TestFlight-Gruppen |
| **Test-Accounts** | Liste (E-Mail, Rolle) | — |

## Design-Kopplung (Claude Design)

<!-- Verknüpfung der App mit Claude Design. Gilt für dev und prod gleichermaßen (ist keine Umgebung).
     Wird von `/design sync` beim ersten Lauf automatisch befüllt: ID aus dieser Datei → sonst Suche nach
     App-Name → sonst Projekt anlegen und ID hier eintragen. Der Login (`/design-login`) ist pro Mac, nicht pro App. -->

| Verweis | Wert |
|---------|------|
| **Design-System-Projekt** (Tokens + Komponenten, Ziel von `/design sync`) | Name: `<App-Name>` · projectId: `<uuid>` |
| **Screens-Projekt** (Quelle von `/design screen PROJ-X`) | Name: `<Projektname in Claude Design>` |
| Letzter Sync | YYYY-MM-DD (Release / Re-Theme) |

## Per-Feature-Setup

<!-- Eine Zeile pro Feature mit Env-Bedarf. Was, wo, und ob es auf dev/prod verifiziert ist. -->

| Feature | Setup | dev | prod |
|---------|-------|-----|------|
| _PROJ-X_ | _z. B. Edge-Function-Secret `API_KEY`, Cron `sync_daily`_ | ☐ | ☐ |

## Checkliste: neue Umgebung anlegen

1. Supabase-Projekt erstellen, Region wählen, Project-Ref in die Matrix und in die Shell-Env für `.mcp.json` (siehe `docs/MCP.md`)
2. Alle Migrationen aus `supabase/migrations/` in Reihenfolge anwenden; `list_migrations` gegen Repo abgleichen
3. Advisors laufen lassen (`get_advisors` security + performance), Befunde beheben
4. Auth konfigurieren: Site URL, Redirect URLs, Mail-Templates, SMTP, Password Policy, Rate Limits
5. Vault-Secrets und Edge-Function-Secrets setzen (Namen aus der Tabelle oben); Edge Functions deployen
6. Crons anlegen (pg_cron + pg_net), Testlauf prüfen
7. Push-Credentials (falls Push im Scope): APNs-Key bei EAS hinterlegen
8. EAS-Secrets setzen (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
9. Test-Accounts anlegen (nur dev)
10. Release-Check (`docs/RELEASE-CHECK.md`) gegen die neue Umgebung fahren
