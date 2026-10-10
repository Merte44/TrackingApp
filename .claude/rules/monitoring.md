---
paths:
  - "supabase/**"
  - "app.json"
  - "app.config.*"
  - "eas.json"
---

# Monitoring, Rate-Limits & Performance

> Gilt nur, wenn ein Release auf **TestFlight External** oder **App Store** zielt — echte, fremde Nutzer. Für Dev-Client und TestFlight Internal entfällt dieser Abschnitt (siehe `/deploy`-Gate); Modus lokal entfällt ebenfalls (keine Server-Umgebung, siehe `.claude/rules/local-db.md`).

## Crash- & Error-Monitoring
- Vor dem ersten External-Release muss eine Crash-/Error-Erfassung eingebunden und **mit einem erzeugten Testfehler verifiziert** sein (z. B. Sentry, oder die eingebaute EAS-/Expo-Fehlererfassung)
- Fehlerberichte enthalten **nie** Secrets, Tokens oder Personendaten — dieselbe Grenze wie bei Logs (`.claude/rules/security.md`): Breadcrumbs/Kontext auf technische Felder beschränken, nie Formulareingaben oder Nutzerinhalte mitschicken

## Rate-Limits (Modus supabase)
- Auth-Rate-Limits (Sign-in, Sign-up, Passwort-Reset) im Supabase-Dashboard gesetzt, nicht nur Default — Schutz gegen Credential Stuffing
- Zusätzliche API-Rate-Limits, wenn eine Edge Function oder ein RPC ohne eigene Begrenzung von außen erreichbar ist
- Fundort (nicht der Wert) in `docs/ENVIRONMENTS.md` dokumentieren, pro Umgebung abgehakt

## Performance
- `get_advisors` performance auf prod sauber — keine offene Warnung vor einem External-Release
- Ein Kern-Ablauf (der aus dem Release-Gate in `/deploy`) unter normalem Gebrauch geprüft: Antwortzeit plausibel, kein N+1 im kritischen Pfad (Joins statt Einzel-Queries, siehe `.claude/rules/backend.md`)

## Laufender Betrieb
- Ab dem ersten External-Release übernimmt `/ops` die Überwachung (Advisors, Cron, Edge-Function-Logs, Auth-Fehlerhäufungen) — als `/schedule`-Routine, nicht nur bei Bedarf
- Neue Warnungen, die `/ops` meldet, sind kein automatischer Stopp, aber eine offene Aufgabe vor dem nächsten External-Release
