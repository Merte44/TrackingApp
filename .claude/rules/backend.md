---
paths:
  - "lib/supabase*"
  - "lib/**"
  - "supabase/**"
---

# Backend-Regeln

## Datenbank (Supabase)
- Row Level Security auf **jeder** Tabelle; Policies nur für die CRUD-Operationen, die das Feature braucht
- Indizes auf Spalten in WHERE / ORDER BY / JOIN; Foreign Keys mit `ON DELETE CASCADE`, wo sinnvoll
- Schema-Zustand nie annehmen — Tabellen erst listen, dann ändern

## MCP-Server (zwei Umgebungen)
- `mcp__supabase-dev__*` → dev-Projekt, der tägliche Arbeits-Server. `mcp__supabase-prod__*` → prod-Projekt, nur explizit für reviewte Migrationen. Beide mit Schreibzugriff, je fest auf ein Projekt gepinnt (`docs/MCP.md`)
- Ohne MCP: SQL als Datei in `supabase/migrations/` schreiben und den User bitten, sie im Studio auszuführen

## Rückwärts-kompatibel? (PFLICHT vor dem Migrations-Pfad)

Ohne OTA läuft auf den Geräten der Nutzer **alter JS-Code weiter**, bis ein neuer Build installiert ist. Die DB änderst du in Sekunden, die App nicht. Jeder Schritt, der etwas **wegnimmt oder umbenennt**, kann deshalb einen bereits ausgelieferten Build brechen:

- Spalte, Tabelle, View oder Funktion droppen/umbenennen
- Rückgabetyp oder Signatur eines RPC ändern (auch das Entfernen eines einzelnen Feldes)
- NOT NULL ohne Default ergänzen, Enum-Wert entfernen, Spaltentyp verengen

**Vor einem solchen Schritt gegen den ausgelieferten Stand prüfen — nicht gegen den Repo-Stand.** Der Commit des letzten ausgelieferten Builds steht in `docs/RELEASES.md`:

```bash
git grep -n "<name>" <build-commit> -- app lib components hooks
```

Trifft die Suche, gilt die Reihenfolge: **erst den Build ausliefern, der ohne das Feld auskommt, warten bis er überall läuft, dann wegnehmen.** Geht das nicht (der Build ist schon draußen und bricht bereits), ist ein Kompatibilitäts-Shim der schnelle Weg — das Weggenommene minimal wiederherstellen, ohne den alten Zustand komplett zurückzuholen, und mit einer Folgemigration wieder entfernen, sobald kein ausgelieferter Build es mehr liest.

Ergebnis der Prüfung in die Migration als Kopfkommentar. **„Braucht keinen Build" ist erst belegt, wenn der ausgelieferte Build geprüft wurde** — ein sauberer Repo-Stand belegt es nicht.

## Migrations-Pfad (PFLICHT)
1. Versionierte Migration als Datei `supabase/migrations/<NNNN>_<proj-x>_<name>.sql` schreiben — die Datei ist die Quelle der Wahrheit, auch wenn per MCP angewandt
2. Auf **dev** anwenden (`apply_migration`)
3. `get_advisors` (security + performance) — keine neue Warnung akzeptieren
4. **Rollback-Probe** in `supabase/tests/` (siehe unten) — Pflicht bei RPC-, RLS- oder Trigger-Änderungen
5. prod erst nach Freigabe des Users; destruktive Ops (DROP, TRUNCATE, datenverlierendes ALTER) auf prod **immer** vorher bestätigen lassen
6. Nach prod: `list_migrations` gegen die Repo-Liste abgleichen

## Rollback-Probe (`supabase/tests/<proj-x>_<name>.sql`)
- Ein `DO $$ … $$`-Block: seedet in einer Transaktion, impersoniert Nutzer per `set_config('request.jwt.claims', …, true)` und `set local role authenticated`, assertet mit `RAISE EXCEPTION 'FAIL: …'`, endet mit `RAISE EXCEPTION 'REGRESSION_PASS …'` — die Exception rollt alles zurück, nichts persistiert
- **Jeder Pfad endet mit einem unbedingten RAISE** — auch nach dem letzten Assert, auch bei „nichts zu prüfen". Ein Pfad ohne RAISE committet den Seed
- Nutzer dynamisch aus `auth.users` wählen → portabel dev/prod
- **Auf prod nur Proben, die am selben Tag auf dev grün waren** (`REGRESSION_PASS`); nie eine Probe zuerst auf prod fahren
- **Nie auf prod:** Proben, die Funktionen mit externen Nebenwirkungen anstoßen (Mail, Admin-API, HTTP via pg_net, Push). Ein Rollback holt keine gesendete Mail zurück — solche Proben bleiben dev-only und werden im Kopfkommentar als `DEV_ONLY` markiert
- Deckt die Server-Grenze ab, die Jest mit gemocktem Client nie sieht: RLS-Sichtbarkeit, RPC-Ablehnung (`42501`), Trigger-Verhalten
- Wird von `/backend` geschrieben und von `/qa` erneut gefahren

## Data-Access-Layer (keine API-Routen)
- Supabase **ist** das Backend. Das Frontend ruft nie `fetch()` auf eine Route im Repo, sondern Funktionen aus `lib/<feature>.ts`
- Jede Funktion: Zod-Validierung **vor** dem Supabase-Call, Client aus `lib/supabase.ts`, Rückgabe `{ data, error }`
- Server-only-Logik (Fremd-API-Keys, Admin-Operationen, Jobs) → Edge Functions (Deno), aufgerufen via `supabase.functions.invoke()`
- Joins statt N+1 (`select('*, related(*)')`); `.limit()` auf jeder Listen-Query; `error` immer prüfen
- Datenladen: async-Funktionen aus `useEffect` + `useState`; react-query ist optionales Upgrade

## Per-Umgebung-Setup
- Braucht ein Feature Vault-Secrets, Edge-Function-Secrets, Crons, Auth-Templates, SMTP oder Push-Credentials, wird das **in `docs/ENVIRONMENTS.md` eingetragen** (Name + Fundort, nie der Wert) — für dev und prod getrennt abgehakt
- Edge Functions deployen mit `--no-verify-jwt` nur, wenn der Aufruf per eigenem Secret (Hook-Secret) abgesichert ist

## Auth & Security
- Session-Prüfung bei sensiblen Operationen (`supabase.auth.getSession()`); RLS ist die echte Autorisierung, Client-Checks sind UX
- Keine Secrets im Code; `EXPO_PUBLIC_*` ist öffentlich (landet im Bundle); Service-Role-Key nie im Client, nur in Edge Functions
- RLS-Policies mit `SECURITY DEFINER`-Helfern: `search_path` pinnen, `anon` revoken, `authenticated` EXECUTE behalten
