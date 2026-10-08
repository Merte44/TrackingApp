# Product Requirements Document — TrackingApp

## Vision
Eine persönliche iOS-App, die Kalorien und Nährwerte (Carbs, Fette, Eiweiß) auf **einem einzigen Screen** zeigt — was heute gegessen wurde und was noch übrig ist. Eintragen dauert Sekunden: per Barcode-Scan (Open Food Facts), Suche, „zuletzt verwendet" oder eigene Lebensmittel. Man tippt nur die Menge, nie Nährwerte.

## Target Users
Nur der Entwickler selbst, auf einem iPhone. Bedürfnis: Ernährung täglich und ohne Aufwand tracken. Schmerz: gängige Tracker-Apps sind überladen, voller Werbung und Abos.

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Lokale Datenbank | In Review |
| P0 (MVP) | Eigene Lebensmittel | Roadmap |
| P0 (MVP) | Ernährungstagebuch | Roadmap |
| P0 (MVP) | Produktsuche & Barcode-Scan | Roadmap |
| P0 (MVP) | Tagesziele | Roadmap |
| P0 (MVP) | Zeitleiste | Roadmap |
| P0 (MVP) | Haupt-Screen | Roadmap |
| P1 | Mahlzeiten-Vorlagen | Roadmap |

## Success Metrics
- App wird an **mindestens 6 von 7 Tagen** genutzt (erste 4 Wochen)
- Bekanntes Lebensmittel („Verwendet") in **≤ 5 Sekunden** eingetragen, gescanntes in **≤ 10 Sekunden**
- Nach Erstabruf funktioniert alles Bekannte **offline**

## Constraints
- **Solo, privat, 0 € laufende Kosten.** Keine App-Store-Veröffentlichung; Installation per TestFlight (intern) oder Dev-Build. Legal-Gates (Datenschutz, Impressum, App-Privacy, Account-Löschung) entfallen
- **Kein Backend — on-device (`expo-sqlite`).** Kein Login, kein Account. Sicherung über das iCloud-Gerätebackup. Grund: Supabase-Gratiskontingent (2 Projekte, account-weit) ist durch eine andere App belegt; eine Ein-Geräte-Privat-App braucht keinen Server. Späterer Umstieg auf einen Server bleibt möglich
- **Open Food Facts** (Name- und Barcode-Suche). Internet nur beim Erstabruf eines Produkts; jedes abgerufene Produkt wird lokal gespeichert und ist danach offline auffindbar (Suche, „Verwendet", erneuter Scan)
- **Fachregeln:**
  - Nährwerte pro 100 g; Menge in Gramm (ml wie Gramm) oder in Stück, wenn ein Stückgewicht hinterlegt ist (Portionsgröße von Open Food Facts wird vorgeschlagen)
  - Vier feste Mahlzeiten: Frühstück, Mittagessen, Abendessen, Snacks
  - Jeder Tag ist bearbeitbar — Vergangenheit, heute, Zukunft
  - Kalorienziel und Nährwertziele sind **getrennt** einstellbar und beeinflussen sich nicht; ein Ziel gilt **ab dem gewählten Tag**, vergangene Tage behalten ihr damaliges Ziel
  - Eingetragene Einträge sind Schnappschüsse: Bearbeiten oder Löschen eigener Lebensmittel und Vorlagen ändert keine bereits eingetragenen Tage
  - Eine Mahlzeiten-Vorlage wird als einzelne Lebensmittel eingetragen (einzeln änderbar/löschbar)
  - Barcode nicht gefunden oder unvollständig → „Neues Lebensmittel" mit Barcode und bekannten Werten vorausgefüllt; danach ist es ein eigenes Lebensmittel
- **Design:** Hintergrund `linear-gradient(to bottom, #E1F1FB 0%, #EBEBF0 100%)`; alle Unter-Screens als `formSheet`; Farben Carbs türkis, Fette lila, Eiweiß orange; Kürzel C / F / E; Kopfzeile je Mahlzeit nur in Gramm; Wisch-Löschen mit rotem Papierkorb; Hinzufügen-Sheet mit Suche und Reitern „Verwendet" · „Lebensmittel" (nur eigene) · „Mahlzeiten" (Vorlagen); Detail-Sheet mit Nährwerttabelle (Menge und pro 100 g) sowie änderbarer Menge und Mahlzeit
- iOS-only, Deutsch, kein i18n

## Non-Goals
- Kein Account, kein Sync, keine Nutzung auf mehreren Geräten
- Keine App-Store-Veröffentlichung, kein Android
- Kein Tracking von Wasser, Gewicht oder Sport; keine Apple-Health-Anbindung
- Keine Statistiken oder Verlaufsdiagramme über mehrere Tage
- Keine Rezepte mit Zubereitung, keine Erinnerungen/Push-Mitteilungen

---

Use /write-spec to create detailed feature specifications for each item in the roadmap above
