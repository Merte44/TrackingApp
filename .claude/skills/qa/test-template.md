# QA-Report (nur bei Bugs) — `docs/qa/<ID>-qa-YYYY-MM-DD.md`

```markdown
# <ID> — QA YYYY-MM-DD — NOT READY

**Gates:** /code-review <n Findings> · /security-review <n Findings> · Rollback-Probe <PASS/FAIL/—> · tsc/Jest <grün/rot>
**ACs:** <x/y belegt> (Screenshots `docs/qa/shots/<ID>-*.png`)

## Bugs
### BUG-1 — <Titel> — <Critical|High|Medium|Low> — <Frontend|Backend>
- Repro: 1. … 2. … Erwartet: … Tatsächlich: …
- Beleg: <Screenshot / SQL / Finding>

## Needs device check
- <nur echte Gerätefälle: Push, Kamera, Haptik>

## Routing
`/frontend <ID>` (BUG-…), `/backend <ID>` (BUG-…)
```
