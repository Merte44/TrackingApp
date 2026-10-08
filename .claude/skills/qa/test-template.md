# QA-Report (nur bei Bugs) — `docs/qa/<ID>-qa-YYYY-MM-DD.md`

```markdown
# <ID> — QA YYYY-MM-DD — NOT READY

**Gates:** /code-review <n Findings> · /security-review <n Findings> · Rollback-Probe <PASS/FAIL/—> · tsc/Jest <grün/rot>
**ACs:** <x/y bestanden> (Screenshots `docs/qa/shots/<ID>-*.png`)

## Ergebnis pro AC
| AC | Ergebnis | Methode | Beleg |
|----|----------|---------|-------|
| AC-1 | bestanden | Test | `lib/<feature>.test.ts` „AC-1: …" |
| AC-2 | nicht bestanden | Simulator | BUG-1 |
| AC-3 | nicht prüfbar | — | needs device check (Kamera) |

## Bugs
### BUG-1 — <Titel> — <Critical|High|Medium|Low> — <Frontend|Backend> — verletzt AC-2
- Repro: 1. … 2. … Erwartet: … Tatsächlich: …
- Beleg: <Screenshot / SQL / Finding>

## Needs device check
- <nur echte Gerätefälle: Push, Kamera, Haptik — mit AC-ID>

## Routing
`/frontend <ID>` (BUG-…), `/backend <ID>` (BUG-…)
```

Bugs ohne AC-Bezug (Code-Review-Findings, Regressionen) tragen statt „verletzt AC-n" den Hinweis „kein AC — <Regel/Gate>". Ein Bug, der keine AC verletzt, aber das Verhalten falsch macht, zeigt eine Lücke in der Spec → zusätzlich `/refine` vorschlagen.
