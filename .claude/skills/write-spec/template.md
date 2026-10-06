# <ID>: Feature-Name

**Status:** Planned · **Release:** — · **Bereich:** _Fundament | Konto | Runden | Tippen | Social | Ansichten_ · **Stand:** YYYY-MM-DD
**Design:** `docs/design/screens/<ID>.html` — oder der Screen im Mockup, wenn nichts exportiert ist. Backend-only: „—"

<!-- Spec-Regeln (gelten für alle Abschnitte):
     · Gegenwartsform — die Spec beschreibt, was das Feature TUT, nicht was geplant war.
     · Verweise statt Code — Pfade, Funktionsnamen, Tabellen; keine Snippets, keine Spaltenlisten.
     · Kein datierter Implementation-Notes-Block. Was gebaut wurde, steht in den Abschnitten;
       DASS es gebaut wurde, steht als eine Zeile im Verlauf.
     · Ziel 80–150 Zeilen. Wird es länger, prüfen, ob mehrere Abläufe drinstecken — Prüfsignal, kein Teilungszwang. -->

## Was es tut
<!-- 3–6 Sätze. Was kann ein Nutzer damit, und warum gibt es das.
     Der Titel oben sagt konkret WOFÜR — „Tipprunden-Einladungen", nicht „Einladungen". -->

## Dependencies
<!-- Eine Zeile pro Abhängigkeit MIT Grund — was genau dieses Feature von dort bezieht.
     Eine Abhängigkeit ohne Grund muss man im Code nachschlagen; das ist der Zweck der Spec.
     Auch Roadmap-Features nennen, wenn sie die Abgrenzung erklären. Keine: „—". -->

| Feature | Wofür |
|---------|-------|
| **<ID2>** Name | … |

## Screens & Komponenten
<!-- Backend-only Feature: "—". -->

| Pfad | Zweck |
|------|-------|
| `app/…` | … |
| `components/<domain>/…` | … |

## Daten & Server
<!-- Tabellen · RPCs · Edge-Function-Aktionen · Cron-Jobs · Data-Access in lib/.
     RLS-Kernregel in einem Satz: wer darf was sehen/schreiben. -->

- **Tabellen:** …
- **RPCs / Funktionen:** …
- **Edge Functions / Cron:** …
- **Data-Access:** `lib/<feature>.ts` — …
- **RLS:** …

## Regeln
<!-- Die verbindlichen Verhaltensregeln inkl. Grenzfällen: Sperren, Limits, Sichtbarkeit,
     was bei Fehlern/Leerzuständen passiert. Das Warum als Halbsatz, nicht als eigener Abschnitt. -->

## Acceptance Criteria
<!-- Nur solange das Feature nicht Deployed ist — /qa arbeitet diese Liste ab.
     Beim Deploy verdichtet /deploy sie zu `Regeln` und entfernt diesen Abschnitt. -->

- [ ] Angenommen [Vorbedingung], wenn [Aktion], dann [Ergebnis]

## Grenzen
<!-- Was bewusst NICHT drin ist — und wohin es stattdessen gehört (Feature-ID oder "offen").
     Auch der Ort für offene Punkte; einen Open-Questions-Abschnitt gibt es nicht mehr. -->

## Umgebung
<!-- Per-Umgebung-Setup (Vault-Secret, Edge-Function-Secret, Cron, Auth-Template, SMTP,
     Push-Zertifikat, EAS-Secret)? Hier benennen UND in docs/ENVIRONMENTS.md eintragen.
     Sonst: "Kein Per-Env-Setup". -->
- Kein Per-Env-Setup

## Tests
- **Jest:** `lib/<feature>.test.ts`
- **Rollback-Probe:** `supabase/tests/projX_….sql`

## Decision Log
<!-- Nur Entscheidungen mit verworfener Alternative — sonst gehört das Warum als Halbsatz
     an die Regel. Bei zusammengeführten Specs: Logs vereinen, Dubletten raus. -->

| Entscheidung | Warum | Verworfen | Datum |
|--------------|-------|-----------|-------|
| … | … | … | YYYY-MM-DD |

## Verlauf
<!-- EINE Zeile pro Ereignis, neueste unten. Keine Reports, keine Fließtext-Zellen —
     Details liegen in docs/qa/, docs/RELEASES.md und `git log --grep="<ID>"`. -->

| Datum | Ereignis | Link |
|-------|----------|------|
| YYYY-MM-DD | Spec geschrieben | — |
