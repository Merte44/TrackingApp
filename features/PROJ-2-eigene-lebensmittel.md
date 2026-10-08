# PROJ-2: Eigene Lebensmittel

**Status:** Planned · **Release:** — · **Bereich:** Kernfunktion · **Stand:** 2026-10-08
**Design:** `docs/design/screens/PROJ-2.html` (Liste) · `docs/design/screens/PROJ-2-form.html` (Formular) — noch nicht vorhanden, vor `/frontend` per `/design screen PROJ-2`

## Was es tut
Ich lege Lebensmittel mit ihren Nährwerten pro 100 g selbst an, bearbeite und lösche sie — damit ich später beim Eintragen nur noch die Menge tippe. Ein eigenes Lebensmittel hat Name, kcal sowie Kohlenhydrate (C), Fett (F) und Eiweiß (E) pro 100 g, optional ein Stückgewicht und einen Barcode. PROJ-2 liefert die Liste der eigenen Lebensmittel und das Formular-Sheet zum Anlegen/Bearbeiten als wiederverwendbare Bausteine; PROJ-3 setzt die Liste als Reiter „Lebensmittel“ ins Hinzufügen-Sheet. Bis dahin erreicht man die Liste über einen vorläufigen Zugang auf dem Start-Screen.

## Dependencies

| Feature | Wofür |
|---------|-------|
| **PROJ-1** Lokale Datenbank | `getDb()`, Migrationsliste — PROJ-2 bringt die erste Fach-Migration mit |
| **PROJ-3** Ernährungstagebuch (Roadmap) | Abgrenzung: bettet die Liste als Reiter „Lebensmittel“ ein, Tipp auf eine Zeile → Mengenabfrage |
| **PROJ-4** Produktsuche & Barcode-Scan (Roadmap) | Abgrenzung: einziger Weg, einen Barcode zu setzen; „Neues Lebensmittel“ vorausgefüllt |
| **PROJ-7** Haupt-Screen (Roadmap) | Abgrenzung: entfernt den vorläufigen Zugang |

## Screens & Komponenten
<!-- füllt /architecture -->
Skizze: Liste eigener Lebensmittel (formSheet, mit Suchfeld im vorläufigen Zugang) · Formular-Sheet Neu/Bearbeiten (formSheet) · vorläufiger Zugang auf `app/index.tsx`.

## Daten & Server
<!-- füllt /architecture -->
- **Tabellen:** eigene Lebensmittel (erste Migration `0001_proj-2_…`)
- **Data-Access:** `lib/foods.ts` — Liste (mit Filter), anlegen, ändern, löschen
- **Server:** keiner (Backend-Modus lokal)

## Regeln
- **Felder:** Name, kcal, C, F, E (alle Pflicht, pro 100 g) · Stückgewicht in g (optional) · Barcode (optional)
- **kcal werden eingegeben**, nicht aus C/F/E berechnet — Etikettwerte weichen ab (Ballaststoffe, Alkohol)
- **Grenzen:** Name nach Trimmen nicht leer · kcal 0–900 · C, F, E je 0–100 g und C + F + E ≤ 100 g · Stückgewicht > 0 · Dezimalkomma erlaubt
- Zod prüft vor jedem Schreibzugriff dieselben Grenzen wie das Formular
- **Barcode:** im Formular nur sichtbar und entfernbar, nicht eintippbar; gesetzt wird er nur über PROJ-4. Ein Barcode gehört zu höchstens einem eigenen Lebensmittel — die Datenschicht lehnt ein Speichern mit vergebenem Barcode mit klarer Meldung ab
- **Doppelte Namen** sind erlaubt (z. B. gleiche Sorte, zwei Marken)
- **Liste:** alphabetisch nach Name, ohne Beachtung der Groß-/Kleinschreibung. Zeile: Name, darunter klein „kcal · C · F · E pro 100 g“. Tipp → Bearbeiten-Sheet (in PROJ-3: Mengenabfrage)
- **Filter:** Teilstring im Namen, unabhängig von Groß-/Kleinschreibung und Umlauten
- **Leer:** „Noch keine eigenen Lebensmittel“ + „Neues Lebensmittel“ · **Kein Treffer:** „Kein Lebensmittel gefunden“ + „Neues Lebensmittel“, Suchbegriff als Name vorausgefüllt
- **Formular:** formSheet mit „Abbrechen“ (links) und „Sichern“ (rechts). „Sichern“ ist deaktiviert, solange ein Pflichtfeld leer oder ein Wert ungültig ist; Fehlertext direkt am Feld. Numerisches Tastenfeld mit Dezimalkomma, „Weiter“ springt zum nächsten Feld
- **Verwerfen:** Abbrechen oder Herunterwischen mit ungespeicherten Änderungen fragt „Änderungen verwerfen?“; ohne Änderungen schließt das Sheet sofort
- **Nach dem Sichern** schließt das Sheet, die Liste zeigt den neuen Stand sofort
- **Speicherfehler:** Sheet bleibt offen mit Eingaben, Fehlerhinweis erscheint
- **Löschen:** Wischen nach links → roter Papierkorb → löscht sofort ohne Rückfrage. Im Bearbeiten-Sheet „Lebensmittel löschen“ mit Bestätigung. Endgültig, kein Rückgängig
- **Schnappschüsse:** Ändern oder Löschen eines eigenen Lebensmittels ändert keine bereits eingetragenen Tage (PRD)
- Alle Unter-Screens als `formSheet`; Tokens, nie Hex; C türkis, F lila, E orange

## Acceptance Criteria
- [ ] **AC-1** Angenommen keine eigenen Lebensmittel, wenn ich die Liste öffne, dann sehe ich „Noch keine eigenen Lebensmittel“ und „Neues Lebensmittel“
- [ ] **AC-2** Angenommen das Formular ist ausgefüllt mit Name, kcal, C, F, E, wenn ich „Sichern“ tippe, dann schließt das Sheet und das Lebensmittel steht in der Liste
- [ ] **AC-3** Angenommen ein Pflichtfeld ist leer, wenn ich das Formular ansehe, dann ist „Sichern“ deaktiviert
- [ ] **AC-4** Angenommen C + F + E ergeben mehr als 100 g, wenn ich die Werte eingebe, dann erscheint ein Fehlertext am Feld und „Sichern“ ist deaktiviert
- [ ] **AC-5** Angenommen kcal über 900, ein negativer Wert oder Stückgewicht 0, wenn ich den Wert eingebe, dann erscheint ein Fehlertext am Feld
- [ ] **AC-6** Angenommen ich gebe „12,5“ ein, wenn ich sichere, dann ist 12.5 gespeichert
- [ ] **AC-7** Angenommen ungültige Werte, wenn die Datenschicht sie unter Umgehung des Formulars schreiben soll, dann lehnt sie das Schreiben ab
- [ ] **AC-8** Angenommen mehrere Lebensmittel, wenn ich die Liste öffne, dann sind sie alphabetisch ohne Beachtung der Groß-/Kleinschreibung sortiert
- [ ] **AC-9** Angenommen ein Lebensmittel „Äpfel“, wenn ich nach „apf“ filtere, dann erscheint es
- [ ] **AC-10** Angenommen kein Name passt zum Suchbegriff, wenn ich filtere, dann sehe ich „Kein Lebensmittel gefunden“ und „Neues Lebensmittel“
- [ ] **AC-11** Angenommen „Kein Lebensmittel gefunden“, wenn ich „Neues Lebensmittel“ tippe, dann ist der Suchbegriff als Name vorausgefüllt
- [ ] **AC-12** Angenommen ein Lebensmittel, wenn ich es antippe, ändere und sichere, dann zeigt die Liste die geänderten Werte
- [ ] **AC-13** Angenommen ungespeicherte Änderungen, wenn ich „Abbrechen“ tippe oder herunterwische, dann fragt die App „Änderungen verwerfen?“
- [ ] **AC-14** Angenommen keine Änderungen, wenn ich „Abbrechen“ tippe, dann schließt das Sheet ohne Rückfrage
- [ ] **AC-15** Angenommen ein Lebensmittel in der Liste, wenn ich nach links wische und den Papierkorb tippe, dann ist es ohne Rückfrage gelöscht
- [ ] **AC-16** Angenommen das Bearbeiten-Sheet, wenn ich „Lebensmittel löschen“ tippe und bestätige, dann ist es gelöscht und das Sheet geschlossen
- [ ] **AC-17** Angenommen ein Lebensmittel mit Barcode, wenn ich ihn im Formular entferne und sichere, dann hat es keinen Barcode mehr
- [ ] **AC-18** Angenommen ein Barcode ist schon an einem eigenen Lebensmittel, wenn die Datenschicht ihn an einem zweiten speichern soll, dann lehnt sie mit klarer Meldung ab
- [ ] **AC-19** Angenommen zwei Lebensmittel mit gleichem Namen, wenn ich das zweite sichere, dann stehen beide in der Liste
- [ ] **AC-20** Angenommen das Speichern schlägt fehl, wenn ich „Sichern“ tippe, dann bleibt das Sheet mit meinen Eingaben offen und ein Fehlerhinweis erscheint
- [ ] **AC-21** Angenommen eine Datenbank von PROJ-1 ohne Fachtabellen, wenn die App mit PROJ-2 startet, dann läuft die Migration und der Migrations-Test besteht Frisch, Upgrade und Idempotenz

## Grenzen
- Barcode setzen (Scan), Vorausfüllen aus Open Food Facts, Konflikt „Barcode schon vergeben“ im Ablauf → PROJ-4
- Einbettung als Reiter „Lebensmittel“, Mengenabfrage, Schnappschuss-Einträge → PROJ-3
- Vorlagen mit eigenen Lebensmitteln → PROJ-8 (Schnappschuss wie bei Einträgen)
- Vorläufiger Zugang auf dem Start-Screen → entfernt in PROJ-7
- Keine weiteren Nährwerte (Zucker, Ballaststoffe, Salz), keine Marke, kein Foto
- Kein Papierkorb/Rückgängig nach dem Löschen; kein Import/Export
- iPad nicht berücksichtigt (nur iPhone)
- Design-Dateien fehlen noch; ohne Claude-Design-Projekt erstellt `/architecture` eine schlichte Vorlage nach PRD-Design-Regeln (offen)

## Umgebung
- Kein Per-Env-Setup

## Plan
<!-- füllt /architecture -->

| # | Aufgabe | ACs | Ebene | Nach | Status |
|---|---------|-----|-------|------|--------|

## Tests
- **Jest:** `lib/foods.test.ts` (Validierung, Sortierung, Filter, Barcode-Eindeutigkeit) · Migrations-Test `lib/db/migrations.test.ts`
- **Manuell (QA):** Formular, Wisch-Löschen, Verwerfen-Dialog im Dev-Client
- **Rollback-Probe:** entfällt (Modus lokal; Ersatz ist der Migrations-Test)

## Decision Log

| Entscheidung | Warum | Verworfen | Datum |
|--------------|-------|-----------|-------|
| Liste + Formular als Bausteine, PROJ-3 bettet ein; vorläufiger Zugang bis PROJ-7 | ein einziger Screen laut Vision | eigene Verwaltungsseite (Zahnrad) | 2026-10-08 |
| kcal eingeben | Etikettwerte weichen von 4/9/4-Rechnung ab | aus C/F/E berechnen | 2026-10-08 |
| Barcode nur über Scan setzbar, im Formular nur entfernbar | Tippfehler ausgeschlossen; Barcode entsteht nur in PROJ-4 | frei eintippbar | 2026-10-08 |
| Barcode eindeutig über eigene Lebensmittel | ein Scan muss eindeutig auflösen | mehrfach erlaubt | 2026-10-08 |
| Doppelte Namen erlaubt | gleiche Sorte, verschiedene Marken | eindeutige Namen | 2026-10-08 |
| Wisch-Löschen ohne Rückfrage, Löschen im Sheet mit Bestätigung | iOS-üblich; Knopf im Sheet leichter versehentlich | überall Rückfrage | 2026-10-08 |
| Endgültig löschen | Einträge sind Schnappschüsse, nichts hängt daran | Soft-Delete/Papierkorb | 2026-10-08 |

## Verlauf

| Datum | Ereignis | Link |
|-------|----------|------|
| 2026-10-08 | Spec geschrieben | — |
