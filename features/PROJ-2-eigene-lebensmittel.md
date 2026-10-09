# PROJ-2: Eigene Lebensmittel

**Status:** Architected · **Release:** — · **Bereich:** Kernfunktion · **Stand:** 2026-10-09
**Design:** Entwurf https://claude.ai/artifact/MFE3SJzKcoTB3ZT5S9N5NA · Dateien `docs/design/screens/PROJ-2-*.html` — Liste: `liste`, `liste-leer`, `liste-kein-treffer`, `liste-wischen`, `liste-ladefehler` · Formular: `form-neu`, `form-fehler`, `form-bearbeiten`, `form-speicherfehler` · Dialoge: `dialog-verwerfen`, `dialog-loeschen` (Design-Component-Quelltext: Layout und Inhalt im Markup, Daten im `renderVals()`-Block)

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
**Routen** (Expo Router, beide `presentation: formSheet`, im Root-Stack registriert):
- `app/foods.tsx` — vorläufiger Listen-Screen: Suchfeld oben, darunter `FoodList`, Knopf „Neues Lebensmittel“ in der Kopfzeile. Wird in PROJ-3 durch den Reiter ersetzt
- `app/food-form.tsx` — Formular-Sheet. Parameter: `id` (Bearbeiten) **oder** `name` (Neu, vorausgefüllt aus dem Suchbegriff). Ohne Parameter: leeres Neu-Formular. Öffnet als Sheet über dem Listen-Sheet
- `app/index.tsx` — vorläufiger Knopf „Eigene Lebensmittel“ → `foods` (entfernt PROJ-7)

**Neue Kompositionen in `components/foods/`** (wiederverwendbar, PROJ-3 bettet sie ein):
- `FoodList` — nimmt Suchbegriff und `onSelect`; zeigt Zeilen, Leer- und Kein-Treffer-Zustand, Wisch-Löschen. Kennt keine Navigation: Tipp auf Zeile ruft `onSelect(food)` (hier → Bearbeiten, in PROJ-3 → Mengenabfrage), „Neues Lebensmittel“ ruft `onCreate(suchbegriff)`
- `FoodRow` — Name, darunter klein „kcal · C · F · E pro 100 g“ mit den Makro-Farben (`carbs`/`fat`/`protein`); umschlossen von `ReanimatedSwipeable` (react-native-gesture-handler) mit rotem Papierkorb (`destructive`)
- `FoodEmptyState` — Text + Knopf „Neues Lebensmittel“, je nach Fall „Noch keine eigenen Lebensmittel“ oder „Kein Lebensmittel gefunden“
- `FoodForm` — die Felder mit react-hook-form + Zod: Name, kcal, C, F, E, Stückgewicht; Barcode nur als Anzeigezeile mit „Entfernen“, wenn gesetzt. Fehlertext je Feld, Fehlerhinweis bei Speicherfehler oben im Formular, „Lebensmittel löschen“ (nur Bearbeiten) unten
- `DecimalField` — Textfeld mit `decimal-pad`; weil das iOS-Zahlenfeld keine Eingabetaste hat, trägt es eine Tastatur-Leiste (`InputAccessoryView`) mit „Weiter“ bzw. „Fertig“ im letzten Feld

**Hook:** `hooks/useFoods.ts` — lädt `listFoods(suchbegriff)`, lädt neu, wenn `lib/foods.ts` eine Änderung meldet; liefert Liste, Ladezustand, Fehler.

**Primitives:** vorhandene `Button`, `Text`; neu per reusables `Input` (Textfeld) und `Separator`. Dialoge („Änderungen verwerfen?“, „Lebensmittel löschen?“) als natives `Alert` — iOS-üblich, kein eigenes Primitive.

## Daten & Server
**Tabelle `foods`** (Migration `0001_proj-2_foods`, erste Fach-Migration):
- `id` — fortlaufende Ganzzahl, Primärschlüssel
- `name` — Text, Pflicht, getrimmt, wie eingegeben gespeichert
- `name_key` — Text, Pflicht: Name kleingeschrieben und ohne Umlaute/Akzente („Äpfel“ → „apfel“). Wird von `lib/foods.ts` beim Schreiben gesetzt, nie vom Frontend. Grund: SQLites eigenes Kleinschreiben kennt keine Umlaute
- `kcal`, `carbs`, `fat`, `protein` — Kommazahl, Pflicht, pro 100 g
- `piece_grams` — Kommazahl, optional (Stückgewicht in g)
- `barcode` — Text, optional, **eindeutig** unter allen eigenen Lebensmitteln
- `created_at`, `updated_at` — Zeitstempel
- **Prüfregeln in der Tabelle** als zweite Sicherung hinter Zod: dieselben Wertgrenzen wie unter Regeln
- **Indizes:** auf `name_key` (Sortierung, Filter); eindeutiger Index auf `barcode` (leere Barcodes zählen nicht)
- **Upgrade-Risiko:** keins — neue Tabelle, bestehende PROJ-1-Datenbanken haben keine Fachdaten. Nicht destruktiv

**Verträge `lib/foods.ts`** (alle Rückgaben `{ data, error }`; Fehler haben eine Art und einen deutschen Nutzertext):
- `Food` — `id`, `name`, `kcal`, `carbs`, `fat`, `protein`, `pieceGrams` (oder leer), `barcode` (oder leer)
- `FoodInput` — dieselben Felder ohne `id`, Zahlen als Zahlen (Komma-Umwandlung macht das Formular)
- `foodInputSchema` — das Zod-Schema mit allen Grenzen; **Formular und Datenschicht nutzen dasselbe**, damit sie nie auseinanderlaufen
- `parseDecimal(text)` — „12,5“ / „12.5“ → 12.5, leer oder unlesbar → ungültig
- `listFoods(suchbegriff?)` — eigene Lebensmittel, nach `name_key` sortiert, gefiltert nach Teilstring im `name_key` (Suchbegriff wird gleich normalisiert); höchstens 500
- `getFood(id)` — ein Lebensmittel oder Fehler „nicht gefunden“
- `createFood(input)` — prüft per Zod, prüft Barcode-Vergabe, speichert; liefert das neue `Food`
- `updateFood(id, input)` — wie `createFood`, der eigene Barcode zählt nicht als vergeben; „nicht gefunden“, wenn gelöscht
- `deleteFood(id)` — löscht endgültig; schon gelöscht zählt als Erfolg
- `subscribeFoods(listener)` — meldet jede erfolgreiche Änderung, liefert eine Abmelde-Funktion
- **Fehlerarten:** `validation` (mit Fehlern je Feld), `barcode_taken` („Dieser Barcode gehört schon zu „<Name>“.“), `not_found`, `db` („Speichern fehlgeschlagen. Bitte erneut versuchen.“)

**Server:** keiner (Backend-Modus lokal).

## Regeln
- **Felder:** Name, kcal, C, F, E (alle Pflicht, pro 100 g) · Stückgewicht in g (optional) · Barcode (optional)
- **kcal werden eingegeben**, nicht aus C/F/E berechnet — Etikettwerte weichen ab (Ballaststoffe, Alkohol)
- **Grenzen:** Name nach Trimmen nicht leer · kcal 0–900 · C, F, E je 0–100 g und C + F + E ≤ 100 g · Stückgewicht > 0 · Dezimalkomma erlaubt
- Zod prüft vor jedem Schreibzugriff dieselben Grenzen wie das Formular
- **Barcode:** im Formular nur sichtbar und entfernbar, nicht eintippbar; gesetzt wird er nur über PROJ-4 (dafür nimmt `createFood` ihn schon jetzt an: nur Ziffern, 8–14 Stellen). Ein Barcode gehört zu höchstens einem eigenen Lebensmittel — die Datenschicht lehnt ein Speichern mit vergebenem Barcode mit klarer Meldung ab (Prüfung vorab plus eindeutiger Index als Sicherung)
- **Doppelte Namen** sind erlaubt (z. B. gleiche Sorte, zwei Marken)
- **Liste:** alphabetisch nach Name, ohne Beachtung der Groß-/Kleinschreibung. Zeile: Name, darunter klein „kcal · C · F · E pro 100 g“. Tipp → Bearbeiten-Sheet (in PROJ-3: Mengenabfrage)
- **Filter:** Teilstring im Namen, unabhängig von Groß-/Kleinschreibung und Umlauten
- **Leer:** „Noch keine eigenen Lebensmittel“, eine Zeile Erklärtext, „Neues Lebensmittel“ · **Kein Treffer:** „Kein Lebensmittel gefunden“ + „Neues Lebensmittel“, Suchbegriff als Name vorausgefüllt
- **Formular:** formSheet mit „Abbrechen“ (links) und „Sichern“ (rechts). „Sichern“ ist deaktiviert, solange ein Pflichtfeld leer oder ein Wert ungültig ist; Fehlertext direkt am Feld. Numerisches Tastenfeld mit Dezimalkomma, „Weiter“ springt zum nächsten Feld
- **Verwerfen:** Abbrechen oder Herunterwischen mit ungespeicherten Änderungen fragt „Änderungen verwerfen?“; ohne Änderungen schließt das Sheet sofort. Herunterwischen wird abgefangen, solange das Formular geändert ist (Navigation verhindert das Entfernen und zeigt den Dialog)
- **Nach dem Sichern** schließt das Sheet, die Liste zeigt den neuen Stand sofort — sie hört auf `subscribeFoods`, nicht auf Navigations-Ereignisse
- **Speicherfehler:** Sheet bleibt offen mit Eingaben, Fehlerhinweis erscheint. `barcode_taken` zeigt den Text der Datenschicht, `validation` die Fehler am Feld, `db` den allgemeinen Hinweis
- **Bearbeiten eines inzwischen gelöschten Lebensmittels** (`not_found`): Hinweis „Lebensmittel nicht mehr vorhanden“, Sheet schließt
- **Liste lädt nicht** (`db`): Hinweis „Lebensmittel konnten nicht geladen werden“ statt Leerzustand, darunter „Erneut versuchen“ (lädt neu)
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
- Höchstens 500 Lebensmittel in der Liste/Trefferliste; bei Bedarf später Nachladen
- AC-20 (Speicherfehler) lässt sich im Dev-Client nicht auslösen — belegt durch Jest (`db`-Fehler der Datenschicht) plus Review des Formulars
- Sicherheit (Modus lokal): keine Fremd-API, keine Kamera, keine destruktive Migration — kein `/security-review`-Sonderbedarf

## Umgebung
- Kein Per-Env-Setup

## Plan

| # | Aufgabe | ACs | Ebene | Nach | Status |
|---|---------|-----|-------|------|--------|
| T1 | Migration `0001_proj-2_foods` + Frisch/Upgrade/Idempotenz im Migrations-Test | AC-21 | Backend | — | erledigt `64f57fb` |
| T2 | `lib/foods.ts` nach Verträgen (Schema, `parseDecimal`, Normalisierung, CRUD, `subscribeFoods`) + `lib/foods.test.ts` | AC-6, AC-7, AC-8, AC-9, AC-17, AC-18, AC-19, AC-20 | Backend | T1 | offen |
| T3 | Liste: `FoodList`, `FoodRow` (Wisch-Löschen), `FoodEmptyState`, `hooks/useFoods.ts`, Route `foods`, Zugang auf `index` | AC-1, AC-8, AC-9, AC-10, AC-15 | Frontend | — (Vertrag reicht) | offen |
| T4 | Formular: `FoodForm`, `DecimalField`, Route `food-form` (Neu/Bearbeiten/vorausgefüllt), Verwerfen-Dialog, Löschen im Sheet, Speicherfehler | AC-2, AC-3, AC-4, AC-5, AC-6, AC-11, AC-12, AC-13, AC-14, AC-16, AC-17, AC-19, AC-20 | Frontend | T3 | offen |

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
| Normalisierte Namensspalte `name_key`, in JS berechnet | SQLite kennt keine Umlaute beim Kleinschreiben; Sortierung und Filter laufen so per Index | Filtern/Sortieren in JS nach Laden aller Zeilen; ICU-Erweiterung | 2026-10-08 |
| Ein Zod-Schema für Formular und Datenschicht | Grenzen können nicht auseinanderlaufen (AC-4/5 vs. AC-7) | getrennte Schemas | 2026-10-08 |
| Liste aktualisiert sich über `subscribeFoods` | funktioniert unabhängig davon, wo PROJ-3 die Liste einbettet | Neuladen bei Screen-Fokus | 2026-10-08 |
| Komponenten ohne Navigation (`onSelect`/`onCreate`) | PROJ-3 hängt eigene Ziele an (Mengenabfrage) | Navigation fest in der Liste | 2026-10-08 |
| **Annahme (Buildchef):** `name_key` macht aus ß „ss“ | „Strasse“ findet „Straße“; Name und Suchbegriff gleich behandelt | ß beibehalten | 2026-10-09 |
| **Annahme (Buildchef):** keine Höchstlänge für den Namen | Spec nennt keine | z. B. 100 Zeichen | 2026-10-09 |
| **Annahme (Buildchef):** eigene `db`-Texte für Löschen („Löschen fehlgeschlagen …“) und Lesen („… konnten nicht geladen werden.“) | passender als der Speichertext | überall Speichertext | 2026-10-09 |
| **Annahme (Buildchef):** Summenfehler C + F + E am Feld Eiweiß | letztes der drei Felder, wie im Entwurf `form-fehler` | eigener Formularfehler | 2026-10-09 |

## Verlauf

| Datum | Ereignis | Link |
|-------|----------|------|
| 2026-10-08 | Spec geschrieben | — |
| 2026-10-08 | Architektur freigegeben | — |
| 2026-10-09 | Screen exportiert (11 Artboards, Design-Artifact) | [Entwurf](https://claude.ai/artifact/MFE3SJzKcoTB3ZT5S9N5NA) |
| 2026-10-09 | Design-Paket freigegeben | — |
