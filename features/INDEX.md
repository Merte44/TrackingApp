# Feature Index

> Zentrale Übersicht aller Features. Wird von den Skills gepflegt.
> **Schlankheitsregel:** eine Zeile pro Feature, Beschreibung ≤ 120 Zeichen, keine Historie.
> Verlauf (Refines, QA, Deploys) steht in der Spec unter **Verlauf**, Releases in `docs/RELEASES.md`.

## Status-Legende
- **Roadmap** — `/init` erledigt, Feature identifiziert, noch keine Spec-Datei
- **Planned** — `/write-spec` erledigt, Spec geschrieben
- **Architected** — `/architecture` erledigt, Design freigegeben
- **In Progress** — `/frontend` oder `/backend` läuft oder ist fertig, noch keine Abnahme
- **In Review** — `/qa` bzw. `/security` läuft
- **Approved** — `/qa` und `/security` bestanden, bereit für ein Release
- **Deployed** — in einem Release enthalten (Spalte **Release** = Build aus `docs/RELEASES.md`)

## Features

| ID | Feature | Beschreibung | Prio | Deps | Status | Release |
|----|---------|--------------|------|------|--------|---------|
| PROJ-1 | Lokale Datenbank | SQLite on-device: Grundgerüst, Schema-Migrationen bei neuen App-Versionen | P0 | – | Approved | |
| PROJ-2 | Eigene Lebensmittel | Anlegen, bearbeiten, löschen; Nährwerte pro 100 g, optional Stückgewicht und Barcode | P0 | PROJ-1 | Approved | |
| PROJ-3 | Ernährungstagebuch | Mahlzeiten (Bereich 4), Hinzufügen-Sheet (Verwendet/Lebensmittel), Mengenabfrage, Detail, Wisch-Löschen | P0 | PROJ-2 | Roadmap | |
| PROJ-4 | Produktsuche & Barcode-Scan | Open Food Facts per Name und Kamera, offline speichern; nicht gefunden → Neues Lebensmittel | P0 | PROJ-2, PROJ-3 | Roadmap | |
| PROJ-5 | Tagesziele | Kalorien- und Nährwert-Karte (Bereich 2+3), zwei getrennte Ziel-Sheets, gültig ab Tag | P0 | PROJ-3 | Roadmap | |
| PROJ-6 | Zeitleiste | Tage wählen (Vergangenheit, heute, Zukunft), Screen passt sich dem Datum an (Bereich 1) | P0 | PROJ-3, PROJ-5 | Roadmap | |
| PROJ-7 | Haupt-Screen | Bereiche 1–4 zusammensetzen, Hintergrund-Verlauf, einheitliche formSheets | P0 | PROJ-1–PROJ-6 | Roadmap | |
| PROJ-8 | Mahlzeiten-Vorlagen | Reiter „Mahlzeiten": Lebensmittel-Kombis anlegen, ansehen, mit einem Tipp eintragen | P1 | PROJ-3 | Roadmap | |

<!-- Neue Features oberhalb dieser Zeile einfügen -->

## Next Available ID: PROJ-9
