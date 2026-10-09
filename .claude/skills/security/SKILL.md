---
name: security
description: Sicherheitsprüfung — /security-review über den Diff und ein Security-Agent, der selbst entscheidet, ob er gebraucht wird, und die App aktiv angreift. Pro Feature nach /qa (setzt Approved), als `release` vor /deploy, jederzeit einzeln. Nie prod.
argument-hint: "<ID> [--auto] | release"
user-invocable: true
---

# Sicherheitsprüfung

## Rolle
`/qa` fragt: Tut das Feature, was die Spec verlangt? Du fragst: **Kann man es missbrauchen?** Du fährst `/security-review`, startest den **Security-Agent** (`.claude/agents/security.md`) in einem frischen Kontext, entscheidest und routest. Du greifst nicht selbst an und **fixst nichts**.

**`--auto`** (Aufruf aus `/buildchef`): eigene Rückfragen entfallen nach der Tabelle *Abweichungen der Skills bei `--auto`* in `.claude/skills/buildchef/SKILL.md`; harte Stopps dort gelten weiter.

## Modi
| Aufruf | Bereich | Danach |
|--------|---------|--------|
| `/security <ID>` | Diff des Features `<basis>..HEAD` (Basis wie in `/qa`, Vor dem Start Schritt 2) | bei SICHER und QA READY: **Approved** |
| `/security release` | seit dem letzten Release-Tag: `git describe --tags --abbrev=0 --match 'v*-build*'` (beim ersten Release der erste Commit) `..HEAD` | Gate für `/deploy`, kein Statuswechsel |

Jederzeit einzeln nutzbar, z. B. nach einem Paket-Update: dann ohne Statuswechsel, nur Bericht.

## Vor dem Start (`<ID>`)
1. `features/INDEX.md`, Spec lesen. Letzte QA-Zeile im **Verlauf** muss READY sein — sonst: „Erst `/qa <ID>`." → Stopp (Ausnahme: Einzelaufruf ohne Statuswechsel)
2. Backend-Modus aus `CLAUDE.md`; App-Scheme aus `app.json`; Simulator gebootet? (`xcrun simctl list devices booted`)
3. **Vorrunde?** Report `docs/qa/<ID>-security-*.md` mit offenen `SEC-n` → Runde 2+

## 1. Gate — `/security-review <bereich>`
Läuft, wenn der Diff Migration/RLS/RPC/Trigger, Edge Function, Auth, Secrets, Deep-Links, Fremd-API, Berechtigungen oder Eingaben von außen berührt (Tabelle in `/qa`); bei `release` immer. Critical/High = Bug.

## 2. Security-Agent — jede Runde frisch
Per Agent-Tool starten, **immer neu**. Auftrag genau: Bereich, Backend-Modus, App-Scheme, Simulator bereit (ja/nein), Modus supabase: Verweis auf die Test-Accounts in `docs/ENVIRONMENTS.md`, bei `release` der Hinweis „ganzes Release — Zusammenspiel der Features und Lieferkette". Runde 2+: nur die offenen `SEC-n` der Vorrunde. **Kein Build-Wissen**, keine Einschätzung, wo es „kritisch" sei.

Er prüft selbst, ob er gebraucht wird, und liefert `NICHT NÖTIG`, `SICHER` oder `BEFUNDE`. Schritt 1 und 2 laufen parallel.

## 3. Verdikt
- **SICHER:** Gate ohne Critical/High · Agent `NICHT NÖTIG` oder `SICHER` (Medium/Low ohne Fix stehen unter **Grenzen** der Spec bzw. in `docs/RELEASES.md`) · `npx tsc --noEmit && npm test` grün — die abgewehrten Angriffe sind jetzt Tests
- **NICHT SICHER:** sonst

Das Ergebnis des Agenten wird nicht mit Build-Wissen überstimmt — Widerspruch nur mit neuem Beleg (wie in `/qa`).

## Bug-Routing
`SEC-n` mit Severity, Szenario, Repro (der rote `*.security.test.ts` oder ein Befehl), **Zielebene** Frontend oder Backend → „`/backend <ID>` (SEC-1), `/frontend <ID>` (SEC-2). Danach erneut `/security <ID>`." Der Fix läuft in einem anderen Kontext. Abbruchregel wie in `/qa`: zweimal an derselben Stelle → `/refine <ID>`.

## Dokumentation
- Nur bei Bugs ein Report `docs/qa/<ID>-security-YYYY-MM-DD.md` (bei `release`: `docs/qa/release-security-YYYY-MM-DD.md`) — Agent-Ausgabe unverändert, Gate-Findings, Abweichungen mit Begründung. Nach SICHER entfernen, Links wie in `/qa` mitziehen
- Spec **Verlauf**: `YYYY-MM-DD | Security | SICHER — 7 Angriffe abgewehrt` · `nicht nötig (reine UI)` · `NICHT SICHER: SEC-1, SEC-2 → docs/qa/…`
- INDEX und Spec-Header: **Approved** bei SICHER (Modus `<ID>`), sonst bleibt **In Review** (Write-Then-Verify)
- Die `*.security.test.ts` des Agenten werden mit committet — sie sind der Regressionsschutz

## Nicht tun
Selbst angreifen statt den Agenten · dem Agenten Build-Wissen mitgeben · Bugs fixen · auf prod prüfen · Medium/Low verschweigen

## Handoff
SICHER: „Sicherheitsprüfung bestanden → **Approved**. Kommt mit dem nächsten Sammel-Release: `/deploy`."
Bugs: „NICHT SICHER, n Bugs → `/backend` / `/frontend <ID>` mit `docs/qa/<ID>-security-….md`. Danach erneut `/security <ID>`."

## Commit
```
test(<ID>): Security check for [feature] — SICHER | NICHT SICHER
```
