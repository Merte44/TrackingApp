# Releases

> Ein Eintrag pro Build. **„Deployed" = im Release enthalten.** Sammel-Deploys sind der Normalfall:
> ein Build trägt mehrere Features, Refines und Fixes. Gepflegt von `/deploy`; gelesen von `/help` und `/deploy`.
> Neuester Eintrag oben.

## Vorlage

```markdown
## vX.Y.Z / Build N — YYYY-MM-DD — <Tier: Dev-Client | TestFlight Internal | TestFlight External | App Store>

**Enthalten**
- PROJ-X <Feature> (neu)
- PROJ-Y <Feature> — Refine <Kurzbeschreibung>
- PROJ-Z — Fix <Kurzbeschreibung>

**prod-Migrationen:** `0012`, `0013` (verifiziert: prod-Liste = Repo-Liste)
**Release-Check:** bestanden (Screenshots `docs/release-checks/vX.Y.Z-buildN/`)
**Offene Gerätetests:** — (oder: Push-Zustellung auf echtem Gerät)
**Notizen:** <Besonderheiten, z. B. neues natives Modul, Schema-Änderung, Env-Setup nachgezogen>
```

---

<!-- Neueste Releases oberhalb dieser Zeile einfügen -->
