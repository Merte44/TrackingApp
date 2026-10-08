# PROJ-1: Lokale Datenbank (SQLite on-device)

**Status:** Planned · **Release:** — · **Bereich:** Fundament · **Stand:** 2026-10-08
**Design:** —

## Was es tut
Die App speichert alle Daten in einer SQLite-Datenbank direkt auf dem iPhone, ohne Server und ohne Login. PROJ-1 liefert das Grundgerüst dafür: Es öffnet die Datenbank beim App-Start, bringt sie per Schema-Migrationen auf den Stand der installierten App-Version und stellt allen weiteren Features eine gemeinsame, testbare Datenbank-Schnittstelle bereit. Ein App-Update darf dabei nie Daten verlieren; schlägt eine Migration fehl, bleibt der alte Datenbestand unverändert und die App sagt das deutlich. Fachtabellen (Lebensmittel, Einträge, Ziele …) bringt jedes Feature als eigene Migration mit. Als Infrastruktur-Feature hat PROJ-1 keinen eigenen Nutzer-Ablauf.

## Dependencies

| Feature | Wofür |
|---------|-------|
| — | Basis für alle anderen Features; PROJ-2 bis PROJ-8 hängen daran |

## Screens & Komponenten
<!-- /architecture füllt — skizziert: Fehler-Screen bei fehlgeschlagener Migration, Start-Gate im Root-Layout -->

| Pfad | Zweck |
|------|-------|
| `app/_layout.tsx` | wartet beim Start auf die Datenbank, solange der Splash-Screen sichtbar ist |
| _(offen)_ | Vollbild-Hinweis bei fehlgeschlagener Migration mit „Erneut versuchen" |

## Daten & Server
<!-- /architecture füllt -->

- **Tabellen:** keine Fachtabellen; nur der Versionsstand über `PRAGMA user_version`
- **Migrationen:** eine append-only-Liste (Ort legt `/architecture` fest), anfangs leer
- **Data-Access:** gemeinsame DB-Schnittstelle in `lib/db/`, auf die alle `lib/<feature>.ts` aufsetzen
- **Server:** keiner (Backend-Modus lokal)

## Regeln
- Beim App-Start werden alle Migrationen oberhalb des gespeicherten Versionsstands der Reihe nach ausgeführt, jede in einer eigenen Transaktion zusammen mit dem Hochsetzen der Version — so gibt es nie einen halb migrierten Stand
- Ausgelieferte Migrationen werden nie geändert, nur neue angehängt; jede Migration trägt die Feature-ID, die sie eingeführt hat
- Foreign Keys sind auf jeder Verbindung eingeschaltet
- Der Splash-Screen bleibt stehen, bis die Datenbank bereit ist; es gibt keinen eigenen Lade-Screen, weil das im Normalfall nur Millisekunden dauert
- **Fehlschlag:** Die Transaktion der fehlgeschlagenen Migration rollt zurück. Bereits erfolgreich gelaufene Migrationen davor bleiben bestehen, weil jede für sich vollständig ist. Die App zeigt einen Vollbild-Hinweis mit der Fehlermeldung und „Erneut versuchen"; der Haupt-Screen lädt nicht, damit neuer Code nicht auf ein altes Schema trifft
- **Neuere Datenbank als App** (z. B. nach einem Downgrade per Dev-Build): Die App migriert nicht rückwärts, verändert nichts und zeigt denselben Hinweis
- Die Datenbankdatei liegt an einem Ort, der im iCloud-Gerätebackup enthalten ist — sie ist die einzige Kopie der Daten
- Kein Feature greift direkt auf SQLite zu, sondern nur über die gemeinsame Schnittstelle; Werte werden nur als gebundene Parameter übergeben
- Supabase-Reste aus dem Template (`lib/supabase.ts`, `@supabase/supabase-js`, `expo-secure-store`, `.env.local.example`) werden entfernt; die App hat keinen Server

## Acceptance Criteria
- [ ] Angenommen eine frische Installation, wenn die App startet, dann wird die Datenbank angelegt, alle Migrationen laufen und der Haupt-Screen erscheint ohne sichtbare Verzögerung nach dem Splash
- [ ] Angenommen eine Datenbank auf dem aktuellen Stand, wenn die App erneut startet, dann läuft keine Migration und nichts ändert sich
- [ ] Angenommen eine Datenbank einer Vorversion mit Daten, wenn neue Migrationen laufen, dann sind alle vorhandenen Daten danach unverändert vorhanden und lesbar
- [ ] Angenommen eine Migration schlägt fehl, wenn die App startet, dann bleibt der Stand vor dieser Migration erhalten, der Fehler-Hinweis erscheint und der Haupt-Screen lädt nicht
- [ ] Angenommen der Fehler-Hinweis ist sichtbar, wenn ich „Erneut versuchen" tippe, dann läuft die Migration erneut und bei Erfolg erscheint der Haupt-Screen
- [ ] Angenommen der gespeicherte Versionsstand ist höher als der der App, wenn die App startet, dann bleibt die Datenbank unverändert und der Fehler-Hinweis erscheint
- [ ] Angenommen eine Verbindung ist geöffnet, wenn ein Eintrag auf einen nicht existierenden Fremdschlüssel verweist, dann wird das Schreiben abgelehnt
- [ ] Angenommen der Migrations-Test läuft unter Jest, dann bestehen die Fälle Frisch, Upgrade und Idempotenz
- [ ] Angenommen PROJ-1 ist gebaut, dann enthält das Repo keinen Supabase-Client mehr, und `npx tsc --noEmit` sowie `npm test` laufen grün

## Grenzen
- Keine Fachtabellen — jedes Feature bringt seine eigene Migration mit (PROJ-2 ff.)
- Kein Export/Import, keine eigene Sicherung — Sicherung läuft nur über das iCloud-Gerätebackup (PRD-Non-Goal Sync)
- Kein Rückwärts-Migrieren bei Downgrade
- Kein Server, keine Synchronisation; ein späterer Umstieg wäre ein eigenes Feature (offen)
- Template-Doku, die Supabase beschreibt (README, BLUEPRINT, Skills), bleibt unverändert — sie ist generisch

## Umgebung
- Kein Per-Env-Setup

## Tests
- **Jest:** Migrations-Test `lib/db/migrations.test.ts` (Frisch, Upgrade, Idempotenz, Fehlschlag mit Rollback, neuere DB als App)
- **Rollback-Probe:** entfällt (Modus lokal; Ersatz ist der Migrations-Test)

## Decision Log

| Entscheidung | Warum | Verworfen | Datum |
|--------------|-------|-----------|-------|
| Nur Grundgerüst, Fachtabellen pro Feature | jede Migration hat eine eindeutige Feature-ID; kein Vorwegnehmen von Fachentscheidungen | Gesamtes Schema vorab in PROJ-1 | 2026-10-08 |
| Fehlschlag → Vollbild-Hinweis, App blockiert | neuer Code auf altem Schema bricht an unvorhersehbaren Stellen | Weiterlaufen mit Banner | 2026-10-08 |
| Splash bleibt bis DB bereit | Migration dauert Millisekunden, ein Lade-Screen würde nur flackern | Eigener Lade-Screen | 2026-10-08 |
| Supabase-Reste in PROJ-1 entfernen | PROJ-1 ersetzt die Datenschicht; toter Code und Abhängigkeiten raus | Liegen lassen | 2026-10-08 |

## Verlauf

| Datum | Ereignis | Link |
|-------|----------|------|
| 2026-10-08 | Spec geschrieben | — |
