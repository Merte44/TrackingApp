---
name: qa
description: Abnahme eines Features gegen seine ACs — Floor-Guard und /code-review über den Diff, dazu ein unabhängiger QA-Agent, der jede AC gegen Tests, Migrations-Test bzw. Rollback-Probe und Dev-Client belegt, ohne den Build-Verlauf zu kennen. Entscheidet READY / NOT READY, routet Bugs. Nach /frontend und /backend, vor /security.
argument-hint: "<ID> [--auto]"
user-invocable: true
---

# Abnahme

## Rolle
Du leitest die Abnahme eines fertig gebauten Features. Du **prüfst die ACs nicht selbst** — das macht der **QA-Agent** (`.claude/agents/qa.md`) in einem frischen Kontext. Wer gebaut hat oder den Build-Verlauf kennt, prüft mit denselben Annahmen, die den Fehler verursacht haben; das gilt auch für diese Sitzung, wenn sie vorher `/frontend` oder `/backend` gefahren hat.

**`--auto`** (Aufruf aus `/buildchef`): eigene Rückfragen entfallen nach der Tabelle *Abweichungen der Skills bei `--auto`* in `.claude/skills/buildchef/SKILL.md`; harte Stopps dort gelten weiter.

Du fährst die Gates, startest den Agenten, entscheidest und routest. Du **fixst nichts**. Ob man das Feature missbrauchen kann, prüft danach `/security`.

## Vor dem Start
1. `features/INDEX.md`, Spec lesen; Status → **In Review**
2. **Ziel des Features bestimmen** — die Basis vor dem ersten Feature-Commit: `git log --oneline --grep="<ID>"` → `<basis>` = Commit davor; Bereich `<basis>..HEAD` (Probe: `git diff <basis>..HEAD --stat`). Alternativ die berührten Pfade. Nötig, weil nach den Commits die Arbeitskopie leer ist — ohne explizites Ziel reviewen die Gates nichts
3. Dev-Client bereit? `xcrun simctl list devices booted`, Metro auf `:8081` (`npx expo start --dev-client`). Modus supabase: Test-Account aus `docs/ENVIRONMENTS.md`
4. **Vorrunde?** Gibt es einen Report `docs/qa/<ID>-qa-*.md` mit offenen Bugs, ist das Runde 2+ — der Agent bekommt dessen Bugs samt Repros

## Welche Tore laufen — nach dem, was sich geändert hat

**Nicht jede Änderung braucht alles.** Sieh dir zuerst den Diff an (`git diff <basis>..HEAD --stat`) und wähle danach. Die Tabelle ist eine Untergrenze, nicht eine Obergrenze: im Zweifel mehr.

| Geändert wurde | Floor-Guard + Code-Gate | QA-Agent | `/security-review` (in `/security`) |
|----------------|-------------------------|----------|-------------------------------------|
| Nur Kommentare, Doku, Tests | — | — | — |
| Reine UI (Layout, Texte, Navigation) | ✅ | ✅ | — |
| `lib/`-Logik ohne DB-Änderung | ✅ | ✅ | — |
| Migration, RLS, RPC, Trigger | ✅ | ✅ inkl. Probe bzw. Migrations-Test | ✅ |
| Lokale Migration (Modus lokal) | ✅ | ✅ inkl. Migrations-Test | — |
| Edge Function, Auth, Secrets, Deep-Links | ✅ | ✅, Gerätefälle als „needs device check" | ✅ |
| Fremd-API, Berechtigungen (Kamera, Fotos, Standort), Eingaben von außen (Scan, Import) | ✅ | ✅, Gerätefälle als „needs device check" | ✅ |

Warum abgestuft: Das Code-Gate fand die teuersten Fehler, die Rollback-Probe nagelte das DB-Verhalten fest — `/security-review` meldete bei Nicht-Security-Diffs fast nie etwas. Gleichbehandlung kostet Stunden, ohne Fehler zu finden.

## 0. Floor-Guard — `python3 scripts/floor-guard.py <basis>`
Sucht im Diff, was das Prüfnetz schwächt statt den Code zu reparieren: abgeschaltete Tests (`.skip`, `.only`), unterdrückte Fehler (`@ts-ignore`, `eslint-disable`, leeres `catch`), entfernte Prüfungen, gelöschte Tests, nicht ersetzte Stubs. Exit 1 → jeder Fund ist ein Bug (Zielebene nach Datei), außer er ist mit `floor-guard: ok — <Grund>` markiert **und** im Decision Log begründet. Exit 2 (konnte nicht prüfen) ist **nie** sauber — Ursache beheben, erneut laufen lassen.

## 1. Code-Gate — `/code-review <basis>..HEAD`
Immer mit explizitem Ziel (Commit-Bereich oder Pfade). Findings Critical/High = Bug (Zielebene notieren). Kein eigener Report.

Warnzeichen im Diff, auch schon beim ersten Mal: **Rettungsmechanik** — Code, der den Abbau einer Komponente, das Verwerfen einer laufenden Eingabe oder das Überholen eines anderen Vorgangs abfangen muss. Solcher Code sitzt meist nicht dort, wo er hingehört; das ist ein Befund für den Report, kein Bug.

Schritt 0 und 1 sind unabhängig von Schritt 2 — der Agent kann parallel laufen.

## 2. Abnahme — QA-Agent, jede Runde frisch
Den **QA-Agent** (`.claude/agents/qa.md`) per Agent-Tool starten — **immer neu**, nie einen früheren QA-Agenten per SendMessage fortsetzen. Der Auftrag enthält **genau das**:
- **Prüfauftrag:** Ausgabe von `python3 scripts/spec-brief.py features/<ID>-*.md`, wörtlich eingefügt
- Feature-ID, Diff-Bereich `<basis>..HEAD`, Backend-Modus, Simulator/Metro bereit (ja/nein), App-Scheme
- Runde 2+: nur der Abschnitt **Bugs** des Vorrunden-Reports (Titel, Repro, erwartetes Verhalten)

**Nicht mitgeben:** was gebaut wurde, wie, warum, welche Tests es gibt, was in früheren Runden schon geklärt schien. Keine Zusammenfassung, keine Einschätzung, kein „achte besonders auf …" aus eigener Kenntnis des Codes — jeder Satz davon trägt die Sicht des Builders in die Prüfung.

Der Agent liefert eine Tabelle **ein Ergebnis pro AC**, Bugs mit Repro, Gegenprobe und Lücken im Auftrag.

## 3. Verdikt
- **READY:** Floor-Guard Exit 0 · Code-Gate ohne Critical/High · **jede AC-ID hat ein Ergebnis** (bestanden mit Methode, oder nicht prüfbar mit Grund — z. B. „needs device check") · keine AC „nicht bestanden" · tsc/Jest grün · offene „needs device check" an `/deploy` übergeben
- **NOT READY:** sonst

**Das Ergebnis des Agenten wird nicht mit Build-Wissen überstimmt.** Hältst du einen seiner Bugs für falsch, brauchst du einen **neuen Beleg** (Repro ausgeführt, Ausgabe gezeigt) — „das ist so gewollt" aus dem Gedächtnis reicht nicht; dann zeigt der Befund eine Lücke in der Spec → `/refine`. Jede Abweichung vom Agenten steht mit Begründung im Report.

„Lücken im Auftrag" (unentscheidbare AC, Verhalten ohne AC) sind keine Bugs, gehen aber an den User: `/refine <ID>` vorschlagen.

## Bug-Routing
Jeder Bug: Severity (Critical / High / Medium / Low) · Repro · verletzte AC-ID · **Zielebene** Frontend (UI, Navigation, State, Client-Validierung) oder Backend (Schema, RLS, RPC, Edge Function, `lib/`). Dem User den Befehl geben: „2 Frontend, 1 Backend → `/frontend <ID>` (BUG-1, 2), `/backend <ID>` (BUG-3)."

Der Fix läuft in einem anderen Kontext als die Prüfung. Danach erneut `/qa <ID>` — mit einem **neuen** Agenten.

**Abbruchregel — zweimal an derselben Stelle heißt `/refine`.** Findet die Abnahme **zum zweiten Mal in Folge** einen Fehler an derselben Stelle, route nicht wieder an `/frontend`/`/backend`, sondern schlage `/refine <ID>` vor. Zwei Fehlschläge am selben Ort sind ein Entwurfsproblem, kein Tippfehler — und der dritte Fix baut erfahrungsgemäß den vierten Fehler ein.

## Dokumentation

**Was dauerhaft gilt, gehört in die Spec — nicht in den Report.** Ein Report gehört zu einer Runde. Alles, was den Tag überdauert, wird **sofort** einsortiert:

| Befund | Gehört nach |
|--------|-------------|
| Mangel, der bestehen bleibt (Restrisiko, ungeprüfte Plattform, Testlücke) | **Grenzen** der Spec |
| Entscheidung mit Begründung | **Decision Log** der Spec |
| Neues Vorhaben, das eine eigene Runde braucht | Roadmap in `docs/PRD.md` |
| „Vor prod/Release noch zu tun" | `docs/ENVIRONMENTS.md` bzw. `docs/RELEASES.md` unter **Ungereleast** |

Ein Abschnitt „Offen" im Report, der nirgendwo sonst auftaucht, ist ein Fehler — dort verschwindet er.

- **Nur bei Bugs** ein Report `docs/qa/<ID>-qa-YYYY-MM-DD.md` ([test-template.md](test-template.md)) — aus Gate-Findings und der Agenten-Tabelle, unverändert übernommen; Abweichungen vom Agenten mit Begründung
- Spec **Verlauf**: eine Zeile — `YYYY-MM-DD | QA | READY — AC 12/12 (Test 9 · Simulator 2 · Review 1)` oder `NOT READY: n Bugs (AC-3, AC-7) → docs/qa/…`
- Spec **Acceptance Criteria**: bei READY die bestandenen ACs abhaken (`- [x]`)
- Spec **Plan**: bei READY den Abschnitt `## Plan` entfernen — er war Arbeitsstand; offene `U…`-Aufgaben vorher nach `docs/ENVIRONMENTS.md` bzw. `docs/RELEASES.md` (Ungereleast) übertragen
- INDEX: bleibt **In Review** — **Approved** setzt erst `/security`
- **Nach READY aufräumen:** Screenshots aus `docs/qa/shots/` löschen und den Report der Vorrunde entfernen, sobald seine Bugs behoben sind. Belege sind Arbeitsmaterial, kein Archiv — die Git-Historie hält sie fest
- **Links mitziehen:** Verlauf-Zeilen, die auf einen gelöschten Report zeigen, bekommen statt des Links den letzten Commit, der ihn enthält: `Report: Commit <hash>` (`git rev-parse --short HEAD` vor dem Löschen). Sonst hinterlässt jede zweite QA-Runde einen toten Verweis — `python3 scripts/check-spec-refs.py` muss danach so grün sein wie vorher

## Nicht tun
ACs selbst prüfen statt den Agenten · dem Agenten Build-Wissen mitgeben · Floor-Guard-Funde wegdiskutieren · Bugs fixen (`/frontend` / `/backend`) · Spec ändern (`/refine`) · Maestro-Flows schreiben · Prüfkataloge abarbeiten, die hier nicht stehen

## Handoff
READY: „Abnahme bestanden. Nächster Schritt: `/security <ID>` — danach **Approved**."
Bugs: „NOT READY, n Bugs → `/frontend` / `/backend` mit `docs/qa/<ID>-qa-….md`. Danach erneut `/qa <ID>`."

## Commit
```
test(<ID>): QA acceptance for [feature] — READY | NOT READY
```
