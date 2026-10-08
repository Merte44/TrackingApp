# PROJ-1: Lokale Datenbank (SQLite on-device)

**Status:** Approved · **Release:** — · **Bereich:** Fundament · **Stand:** 2026-10-08
**Design:** —

## Was es tut
Die App speichert alle Daten in einer SQLite-Datenbank direkt auf dem iPhone, ohne Server und ohne Login. PROJ-1 liefert das Grundgerüst dafür: Es öffnet die Datenbank beim App-Start, bringt sie per Schema-Migrationen auf den Stand der installierten App-Version und stellt allen weiteren Features eine gemeinsame, testbare Datenbank-Schnittstelle bereit. Ein App-Update darf dabei nie Daten verlieren; schlägt eine Migration fehl, bleibt der alte Datenbestand unverändert und die App sagt das deutlich. Fachtabellen (Lebensmittel, Einträge, Ziele …) bringt jedes Feature als eigene Migration mit. Als Infrastruktur-Feature hat PROJ-1 keinen eigenen Nutzer-Ablauf.

## Dependencies

| Feature | Wofür |
|---------|-------|
| — | Basis für alle anderen Features; PROJ-2 bis PROJ-8 hängen daran |

## Screens & Komponenten

| Pfad | Zweck |
|------|-------|
| `app/_layout.tsx` | Start-Gate: hält den Splash-Screen (`expo-splash-screen`), bis `initDatabase()` fertig ist; dann entweder der normale `Stack` oder `DatabaseError` |
| `components/db/DatabaseError.tsx` | Vollbild-Hinweis (SafeAreaView, Tokens): Überschrift, Fehlertext aus `DbInitError.message`, `Pressable` „Erneut versuchen" → `initDatabase()` erneut; während des Versuchs deaktiviert |

Kein eigener Lade-Screen und keine neue Route: Das Gate sitzt im Root-Layout, damit kein Screen vor der fertigen Datenbank rendert.

## Daten & Server

- **Tabellen:** keine Fachtabellen. Versionsstand = `PRAGMA user_version` (0 = leer, n = Migrationen 1…n gelaufen)
- **Datei:** `tracking.db` im Standardordner von `expo-sqlite` (Documents/SQLite — im iCloud-Gerätebackup enthalten). Pro Verbindung: Foreign Keys an, WAL-Journal
- **Verbindungs-Cache:** `expo-sqlite` gibt beim Öffnen derselben Datei die bereits offene native Verbindung zurück, solange nicht `useNewConnection: true` gesetzt ist. Der Erstversuch öffnet normal (Fast Refresh); jeder Retry nach einem Fehlschlag öffnet mit `useNewConnection: true`
- **Migrationsliste:** `lib/db/migrations.ts` — geordnete Liste; jede Migration hat eine Version (fortlaufend ab 1), einen Namen `<NNNN>_<id>_<name>` und einen Schritt, der die Schema-Änderung gegen die DB-Schnittstelle ausführt. Startet **leer**; PROJ-2 hängt die erste an
- **Migrations-Runner:** `lib/db/migrate.ts` — liest `user_version`, führt jede fehlende Migration in **einer eigenen Transaktion** zusammen mit dem Hochsetzen von `user_version` aus, stoppt bei der ersten fehlerhaften. Bekommt die Liste als Parameter, damit der Test eigene Listen einspeisen kann
- **DB-Schnittstelle:** `lib/db/types.ts` — kleine, asynchrone Schnittstelle (ausführen, eine Zeile lesen, mehrere Zeilen lesen, Transaktion), immer mit gebundenen Parametern. Zwei Implementierungen:
  - `lib/db/expo.ts` — hinter `expo-sqlite` (App)
  - `lib/db/testing.ts` — hinter `better-sqlite3` in-memory (nur Jest, Dev-Dependency)
- **Upgrade-Risiko:** keins — PROJ-1 legt keine Tabellen an. Alte Installationen gibt es noch nicht

### Verträge (`lib/db/index.ts`)
- `initDatabase()` → `{ data: { version }, error }` — öffnet die DB, falls nötig, setzt die Pragmas und fährt die Migrationen. `error` ist ein `DbInitError` mit `kind` `migration_failed` (inkl. Name der Migration), `check_failed` (alle Migrationen committet, aber die abschließende Prüfung `foreign_keys = 1` scheitert), `newer_than_app` (gespeicherte Version > höchste bekannte) oder `open_failed`. Mehrfach aufrufbar (Retry); nach einem Fehlschlag ist die alte Verbindung verworfen und der Retry öffnet eine neue. Ist die DB schon bereit, passiert nichts
- `getDb()` → die geöffnete DB-Schnittstelle. Alle `lib/<feature>.ts` holen die Verbindung hier; vor erfolgreichem `initDatabase()` wirft sie (Programmierfehler, durch das Start-Gate ausgeschlossen)
- `setDbForTesting(db)` → ersetzt die Verbindung in Jest durch die In-Memory-Implementierung
- `runMigrations(db, migrations)` → `{ data: { from, to }, error }` (aus `migrate.ts`, für den Test)
- **Server:** keiner (Backend-Modus lokal)

## Regeln
- Beim App-Start werden alle Migrationen oberhalb des gespeicherten Versionsstands der Reihe nach ausgeführt, jede in einer eigenen Transaktion zusammen mit dem Hochsetzen der Version — so gibt es nie einen halb migrierten Stand
- Ausgelieferte Migrationen werden nie geändert, nur neue angehängt; jede Migration trägt die Feature-ID, die sie eingeführt hat
- **Vertrauenswürdige Verbindung:** `initDatabase()` meldet nur dann Erfolg, wenn am Ende des Laufs `PRAGMA foreign_keys = 1` auf der Verbindung geprüft ist — in **jedem** Lauf, auch wenn keine Migration aussteht (DB schon aktuell)
- **Nach jedem Fehlschlag** wird die Verbindung verworfen; das Schließen wird angestoßen, aber nicht abgewartet (ein hängender Aufruf darf den Retry nicht blockieren). Der Retry öffnet garantiert eine neue native Verbindung (`useNewConnection: true`) und setzt die Pragmas neu. Hält die alte Verbindung noch eine Sperre, scheitert der Retry sichtbar mit dem Fehler-Hinweis — nie still
- Foreign Keys sind auf jeder Verbindung eingeschaltet. Nur während ausstehender Migrationen sind sie aus, damit Tabellen-Umbauten keine Kindzeilen per CASCADE löschen; vor jedem Commit prüft `foreign_key_check` die Integrität (Verletzung → Rollback), danach werden sie wieder eingeschaltet und geprüft
- Transaktionen (`Db.transaction`) sind strikt: Schlägt ein Schritt fehl — auch abgefangen oder nicht awaited — wird alles zurückgerollt. Innerhalb einer Transaktion nur `tx` benutzen, nie `getDb()` (blockiert sich selbst)
- Der Splash-Screen bleibt stehen, bis die Datenbank bereit ist; es gibt keinen eigenen Lade-Screen, weil das im Normalfall nur Millisekunden dauert
- **Fehlschlag:** Die Transaktion der fehlgeschlagenen Migration rollt zurück. Bereits erfolgreich gelaufene Migrationen davor bleiben bestehen, weil jede für sich vollständig ist. Die App zeigt einen Vollbild-Hinweis mit der Fehlermeldung und „Erneut versuchen"; der Haupt-Screen lädt nicht, damit neuer Code nicht auf ein altes Schema trifft
- **Neuere Datenbank als App** (z. B. nach einem Downgrade per Dev-Build): Die App migriert nicht rückwärts, verändert nichts und zeigt denselben Hinweis
- Die Datenbankdatei liegt an einem Ort, der im iCloud-Gerätebackup enthalten ist — sie ist die einzige Kopie der Daten
- Kein Feature greift direkt auf SQLite zu, sondern nur über die gemeinsame Schnittstelle; Werte werden nur als gebundene Parameter übergeben
- Fehlertexte im Hinweis (Deutsch): `migration_failed` → „Die Daten konnten nicht auf die neue App-Version umgestellt werden. Deine Daten sind unverändert." · `check_failed` → „Die Datenbank ist umgestellt, die abschließende Prüfung ist fehlgeschlagen. Bitte „Erneut versuchen“ oder die App neu starten. Deine Daten sind erhalten.“ · `newer_than_app` → „Die Daten stammen von einer neueren App-Version. Bitte die aktuelle Version installieren." · `open_failed` → „Die Datenbank konnte nicht geöffnet werden." Technische Details (Migrationsname, Original-Meldung) stehen klein darunter
- Supabase-Reste aus dem Template (`lib/supabase.ts`, `@supabase/supabase-js`, `expo-secure-store` samt Config-Plugin in `app.json`, `.env.local.example`) werden entfernt; die App hat keinen Server
- Neue native Module (`expo-sqlite`) und ein entferntes Plugin erfordern einen neuen Dev-Client-Build (`npx expo run:ios`)

## Acceptance Criteria
- [x] **AC-1** Angenommen eine frische Installation, wenn die App startet, dann wird die Datenbank angelegt, alle Migrationen laufen und der Haupt-Screen erscheint ohne sichtbare Verzögerung nach dem Splash
- [x] **AC-2** Angenommen eine Datenbank auf dem aktuellen Stand, wenn die App erneut startet, dann läuft keine Migration und nichts ändert sich
- [x] **AC-3** Angenommen eine Datenbank einer Vorversion mit Daten, wenn neue Migrationen laufen, dann sind alle vorhandenen Daten danach unverändert vorhanden und lesbar
- [x] **AC-4** Angenommen eine Migration schlägt fehl, wenn die App startet, dann bleibt der Stand vor dieser Migration erhalten, der Fehler-Hinweis erscheint und der Haupt-Screen lädt nicht
- [x] **AC-5** Angenommen der Fehler-Hinweis ist sichtbar, wenn ich „Erneut versuchen" tippe, dann läuft die Migration erneut und bei Erfolg erscheint der Haupt-Screen
- [x] **AC-6** Angenommen der gespeicherte Versionsstand ist höher als der der App, wenn die App startet, dann bleibt die Datenbank unverändert und der Fehler-Hinweis erscheint
- [x] **AC-7** Angenommen ein Init-Lauf ist fehlgeschlagen, wenn „Erneut versuchen“ läuft, dann arbeitet er auf einer neu geöffneten Verbindung — auch wenn das Schließen der alten gescheitert ist — und nach Erfolg gilt `foreign_keys = 1`
- [x] **AC-8** Angenommen eine Datenbank auf dem aktuellen Stand, wenn `foreign_keys` auf der Verbindung aus ist, dann meldet `initDatabase()` keinen Erfolg, sondern einen Fehler
- [x] **AC-9** Angenommen alle Migrationen sind committet und das Wiedereinschalten der Foreign Keys scheitert, wenn der Hinweis erscheint, dann zeigt er den `check_failed`-Text (nicht „Deine Daten sind unverändert“)
- [x] **AC-10** Angenommen eine Verbindung ist geöffnet, wenn ein Eintrag auf einen nicht existierenden Fremdschlüssel verweist, dann wird das Schreiben abgelehnt
- [x] **AC-11** Angenommen der Migrations-Test läuft unter Jest, dann bestehen die Fälle Frisch, Upgrade und Idempotenz
- [x] **AC-12** Angenommen PROJ-1 ist gebaut, dann enthält das Repo keinen Supabase-Client mehr, und `npx tsc --noEmit` sowie `npm test` laufen grün

## Grenzen
- Keine Fachtabellen — jedes Feature bringt seine eigene Migration mit (PROJ-2 ff.)
- Kein Export/Import, keine eigene Sicherung — Sicherung läuft nur über das iCloud-Gerätebackup (PRD-Non-Goal Sync)
- Kein Rückwärts-Migrieren bei Downgrade
- Kein Server, keine Synchronisation; ein späterer Umstieg wäre ein eigenes Feature (offen)
- Template-Doku, die Supabase beschreibt (README, BLUEPRINT, Skills), bleibt unverändert — sie ist generisch
- Keine Verschlüsselung der DB-Datei — iOS-Datenschutz des Geräts genügt für eine private App (offen, falls sich das ändert)
- Der echte Fehlerfall auf dem Gerät lässt sich nur per Jest sicher erzeugen; der Fehler-Hinweis wird im Dev-Client über eine absichtlich fehlerhafte Test-Migration geprüft, die nicht committet wird
- Dark Mode: `tailwind.config.js` nutzt `darkMode: 'class'`, ohne dass das System-Erscheinungsbild gesetzt wird — die `.dark`-Tokens greifen app-weit nicht (Design-System, offen; nicht PROJ-1)
- Hält eine verworfene Verbindung noch eine Schreibsperre (offene Transaktion), scheitert jeder Retry, bis die App beendet ist — bewusst sichtbar statt still; kein Erzwingen des Schließens
- `tsconfig.json` nimmt noch `supabase/functions` in `include` auf (Template-Rest, ohne Wirkung — kein Ordner vorhanden)
- Restrisiken aus QA (Low, hingenommen): Root-Layout rendert während Laden/Fehler keinen Navigator — unkritisch, solange es keine Deep-Links gibt (sonst neu prüfen); `setDbForTesting` kann einen laufenden `initDatabase()` nicht abbrechen (nur Tests)
- Restrisiken aus QA Runde 3 (Medium, unter „scheitert sichtbar statt still“ gefasst): ein fehlgeschlagenes ROLLBACK wird verschluckt und erst beim Retry als Sperre sichtbar; `close()` der verworfenen Verbindung läuft durch dieselbe Warteschlange und erreicht bei einem hängenden Aufruf nie das native Schließen; jeder Retry öffnet eine weitere native Verbindung, ohne dass die alten sicher geschlossen werden. Low: Fast Refresh von `lib/db/index.ts` setzt den Modul-Zustand zurück, während das Root-Layout „bereit“ bleibt (nur Dev); `foreign_keys` wird bis zu dreimal pro Lauf geprüft; eine offene Transaktion nach gescheitertem ROLLBACK erscheint als `check_failed`
- AC-1 „ohne sichtbare Verzögerung“ hat keine Schwelle; AC-4/5 im Dev-Client nur mit einer nicht committeten fehlerhaften Migration prüfbar — in Runde 3 per Test + Review belegt
- `check_failed`-Text sagt „Die Datenbank ist umgestellt“ auch im Pfad ohne ausstehende Migration (AC-8), wo nichts umgestellt wurde — Text ist so spezifiziert (offen, `/refine`)

## Umgebung
- Kein Per-Env-Setup

## Tests
- **Jest:** Migrations-Test `lib/db/migrations.test.ts` (Frisch, Upgrade, Idempotenz, Fehlschlag mit Rollback, neuere DB als App, Foreign Keys) und `lib/db/index.test.ts` (Start-Gate: Init, Fehlerarten, Retry). Testnamen nennen die AC-IDs: AC-1–11 sind belegt
- **Hinweis:** In den Tests zu AC-7/AC-8 darf der Mock für `openExpoDatabase` die Pragmas nicht selbst setzen, sonst prüft der Test nichts. `lib/db/expo.ts` (nativ) ist unter Jest nicht ausführbar — `useNewConnection` und das nicht abgewartete Schließen dort belegt nur das Review
- **Manuell (QA):** AC-1/4/5/6 sichtbarer Teil (Haupt-Screen bzw. Hinweis) im Dev-Client; AC-12 per Review + `npx tsc --noEmit && npm test`
- **Rollback-Probe:** entfällt (Modus lokal; Ersatz ist der Migrations-Test)

## Decision Log

| Entscheidung | Warum | Verworfen | Datum |
|--------------|-------|-----------|-------|
| Nur Grundgerüst, Fachtabellen pro Feature | jede Migration hat eine eindeutige Feature-ID; kein Vorwegnehmen von Fachentscheidungen | Gesamtes Schema vorab in PROJ-1 | 2026-10-08 |
| Fehlschlag → Vollbild-Hinweis, App blockiert | neuer Code auf altem Schema bricht an unvorhersehbaren Stellen | Weiterlaufen mit Banner | 2026-10-08 |
| Splash bleibt bis DB bereit | Migration dauert Millisekunden, ein Lade-Screen würde nur flackern | Eigener Lade-Screen | 2026-10-08 |
| Supabase-Reste in PROJ-1 entfernen | PROJ-1 ersetzt die Datenschicht; toter Code und Abhängigkeiten raus | Liegen lassen | 2026-10-08 |
| Eigene DB-Schnittstelle, Jest gegen `better-sqlite3` | Jest kann `expo-sqlite` nicht ausführen; echte SQLite im Test statt Mocks prüft SQL und Migrationen wirklich | `expo-sqlite` mocken | 2026-10-08 |
| Eigenes Start-Gate im Root-Layout | eigener Fehler-Screen mit Retry und Downgrade-Erkennung; volle Kontrolle über Splash | `SQLiteProvider` mit `onInit`/Suspense (kein sauberer Retry-Pfad) | 2026-10-08 |
| Verbindung über `getDb()` (Modul-Singleton) | Feature-Funktionen bleiben aufrufbar ohne Durchreichen; das Gate garantiert die Initialisierung; Test tauscht per `setDbForTesting` | DB als Parameter jeder `lib/`-Funktion bzw. React-Context | 2026-10-08 |
| FK-Invariante am Ende jedes Init-Laufs + Retry mit `useNewConnection` | expo-sqlite cacht Verbindungen pro Pfad, Verwerfen allein reicht nicht; die Prüfung fängt jeden Weg zu `foreign_keys = 0` ab, die neue Verbindung jede hängende Transaktion | nur Verwerfen der Verbindung (Fix Runde 1); nur eine der beiden Maßnahmen | 2026-10-08 |
| Eigene Fehlerart `check_failed` | nach committeten Migrationen wäre „Deine Daten sind unverändert“ falsch | unter `open_failed` fassen; Satz für alle streichen | 2026-10-08 |
| Versionsstand per `PRAGMA user_version` | in SQLite eingebaut und transaktional; keine Meta-Tabelle nötig | eigene `schema_migrations`-Tabelle | 2026-10-08 |

## Verlauf

| Datum | Ereignis | Link |
|-------|----------|------|
| 2026-10-08 | Spec geschrieben | — |
| 2026-10-08 | Architektur freigegeben | — |
| 2026-10-08 | Backend gebaut: `lib/db/` (leere Migrationsliste), Migrations-Test grün (30 Tests) | — |
| 2026-10-08 | Frontend gebaut: Start-Gate `app/_layout.tsx`, `components/db/DatabaseError.tsx`; im Simulator geprüft (Start + Fehler-Hinweis) | — |
| 2026-10-08 | QA | NOT READY: 1 Bug (Backend) → [Report](../docs/qa/PROJ-1-qa-2026-10-08.md); Security-Gate übersprungen (nur lokale DB + UI) |
| 2026-10-08 | Backend-Fix BUG-1: Verbindung nach jedem fehlgeschlagenen Start verworfen; Migrations-Test grün (31 Tests) | [Report](../docs/qa/PROJ-1-qa-2026-10-08.md) |
| 2026-10-08 | QA Runde 2 | NOT READY: 2 Bugs (Backend), zweiter Fehlschlag am selben Ort → `/refine` → [Report](../docs/qa/PROJ-1-qa-2026-10-08.md) |
| 2026-10-08 | Refine: QA-Abbruchregel (BUG-2/3) | Verbindung vertrauenswürdig = FK-Prüfung am Ende jedes Laufs + Retry mit `useNewConnection`; neue Fehlerart `check_failed`; 3 neue ACs; Status → Architected | [Report](../docs/qa/PROJ-1-qa-2026-10-08.md) |
| 2026-10-08 | Reality-Check | Spec deckt sich mit Code (31 Tests); `supabase/functions` in `tsconfig.json` als Grenze vermerkt | — |
| 2026-10-08 | AC-IDs vergeben (AC-1–12), Tests zugeordnet | AC-7–9 noch ohne Test (Refine-Umsetzung offen) | — |
| 2026-10-08 | Backend gebaut: Retry mit `useNewConnection`, Schließen nicht abgewartet, FK-Prüfung in jedem Lauf, `check_failed`; Tests zuerst rot, dann grün (34) | — |
| 2026-10-08 | QA Runde 3 | READY — AC 12/12 (Test 12 · Simulator 2 · Probe 3); BUG-2/3 per Probe gegengeprüft; Code-Gate 9 Findings, kein Critical/High (Restrisiken → Grenzen); Security-Gate übersprungen (nur lokale DB) | — |
