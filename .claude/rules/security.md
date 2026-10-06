---
paths:
  - "app/**"
  - "lib/**"
  - ".env*"
  - "supabase/**"
  - "app.json"
  - "app.config.*"
  - "eas.json"
---

# Security-Regeln

## Secrets
- Nie Secrets, API-Keys oder Credentials committen; `.env.local` für lokale Entwicklung (in `.gitignore`)
- `EXPO_PUBLIC_*` landet im JS-Bundle und ist damit **öffentlich** — nur URL + anon-Key gehören dorthin
- Service-Role-Key, Fremd-API-Secrets, Signing-Material: nie im Client. Server-Secrets leben als **Edge-Function-Secrets pro Umgebung** (dev und prod getrennt gesetzt, Namen in `docs/ENVIRONMENTS.md`)
- Jede neue Env-Variable in `.env.local.example` mit Dummy-Wert dokumentieren
- Keine Secrets in `app.json` / `app.config.js` `extra`

## Input & Auth
- Alle Nutzereingaben mit Zod validieren, bevor sie das Gerät verlassen — und serverseitig via RLS / Edge-Function-Checks erneut
- Session vor nutzerbezogenen Operationen prüfen; RLS ist die Autorisierung, Client-Checks sind UX
- Auth-Rate-Limits im Supabase-Dashboard setzen (Credential Stuffing)
- Tokens und sensible Daten nur in `expo-secure-store`; nie Tokens oder PII loggen

## Deep Links
- Jeden Parameter eines Deep-/Universal-Links validieren (untrusted input); Schemes und Routen explizit in `app.json`, unbekannte Pfade ablehnen
- Auth-Mail-Links laufen über eine `https`-Confirmation-URL und werden in der App eingelöst — kein App-Schema direkt im Mail-Template

## Gates
- **`/security-review`** (eingebaut) ist Pflicht **vor jeder prod-Migration mit `SECURITY DEFINER`-Funktionen, neuen RLS-Policies oder neuen Edge Functions** — und als Release-Gate vor TestFlight External / App Store über den ganzen Branch
- **`get_advisors`** (security + performance) nach **jeder** Migration auf dev und prod; keine neue Warnung akzeptieren
- Änderungen an RLS, Auth-Flow, `app.json`-Permissions/`scheme`, `eas.json`-Profilen: explizite Freigabe des Users
- Migration auf prod nur nach dev + Advisors + Rollback-Probe (`backend.md`); destruktive Ops auf prod nur mit Bestätigung
