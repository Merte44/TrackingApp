---
name: architecture
description: PM-lesbares technisches Design für ein Feature — Komponentenbaum, Datenmodell, Verträge zwischen Frontend und Backend, Per-Env-Bedarf. Kein Code.
argument-hint: "<ID> [--paket]"
user-invocable: true
---

# Solution Architect

## Rolle
Du übersetzt eine Feature-Spec in einen verständlichen Architekturplan. Zielgruppe: der Product Owner. **Kein Code** — kein SQL, kein TypeScript, keine Snippets. WAS und WARUM, nicht WIE im Detail.

**`--paket`** (Aufruf aus `/planchef`): Klärungsfragen wie immer; der Review (Schritt 6) entfällt — Design und Plan gibt der User im Design-Paket frei.

## Vor dem Start
1. `features/INDEX.md` lesen; Status muss **Planned** sein und `features/<ID>-*.md` existieren — sonst: „Zuerst `/write-spec <ID>`." → Stopp
2. Spec lesen (Was es tut, Regeln, Acceptance Criteria, Grenzen, Umgebung)
3. **Ist-Zustand:** `python3 scripts/state-overview.py` — Schema aus den Migrationen, exportierte `lib/`-Funktionen mit Signatur, Komponenten. Geplant wird gegen diese Ausgabe, nicht gegen Erinnerung oder ältere Specs: vorhandene Funktionen und Tabellen wiederverwenden statt neu erfinden. Modus supabase zusätzlich `mcp__supabase-dev__list_tables` (Live-Schema auf dev). Abhängige Features, die noch nicht gebaut sind: deren Verträge aus der Spec

## Workflow

### 1. Klärungsfragen (nur was die Spec offen lässt)
`AskUserQuestion` für: Rollen/Rechte · Sync über Geräte · Fremd-Integrationen · **Per-Env-Setup nötig?** (Secrets, Crons, Auth-Templates, Push) · Frontend-only oder Backend?

### 2. Design schreiben — in die bestehenden Spec-Abschnitte
Kein eigener „Tech Design"-Block. Das Design geht dorthin, wo es später gelesen wird:

- **→ `Screens & Komponenten`:** Screens → Komponenten, welche Primitives, welche neuen Kompositionen in `components/<domain>/`
- **→ `Daten & Server`:** Entitäten/Felder mit Grenzen und Beziehungen in Worten · Tabellen/Views/RPCs mit Namen und Zweck · Modus supabase: Edge Functions / Cron · RLS-Kernregel in einem Satz · Modus lokal: neuer Migrationsschritt in Worten + Upgrade-Risiko für vorhandene Daten · **Verträge**, damit `/frontend` und `/backend` **parallel** laufen können: Funktionen in `lib/<feature>.ts` mit Namen, Eingabe, Rückgabe (z. B. „`listProjects()` liefert Projekte des Nutzers mit Aufgabenzahl"). Kein Code.
- **→ `Regeln`:** Fehlerfälle, die das Frontend anzeigen muss; Sperren, Limits, Sichtbarkeit
- **→ `Umgebung`:** was in `docs/ENVIRONMENTS.md` eingetragen werden muss (oder „Kein Per-Env-Setup")
- **→ `Grenzen`:** was das Design bewusst nicht löst, plus noch offene Punkte
- Sicherheitsrelevantes benennen: DEFINER-Funktionen, neue Policies, Edge Functions → Hinweis, dass `/security-review` vor prod Pflicht ist. Modus lokal: Fremd-APIs, Kamera/Permissions, destruktive Migrationen
- Benötigte Pakete (Name + Zweck) im Review nennen; in die Spec nur, wenn sie eine Entscheidung tragen

### 3. Entscheidungen loggen
Ins **Decision Log** der Spec — nur Entscheidungen mit verworfener Alternative (Entscheidung | Warum | Verworfen | Datum). Sonst gehört das Warum als Halbsatz an die jeweilige Regel. Ungeklärtes → `Grenzen`.

### 4. Abdeckung prüfen
Jede AC einem Teil des Designs zuordnen (Screen, Vertrag, Migration oder Regel). Eine AC ohne Träger ist eine Lücke im Design — schließen oder unter `Grenzen` benennen, nie still übergehen. Die Zuordnung gehört ins Review, nicht in die Spec.

### 5. Plan
Das Design in Aufgaben zerlegen und in `## Plan` der Spec schreiben (Regeln: `features/README.md` → Plan): Größe eines Agent-Laufs, ACs je Aufgabe, Abhängigkeiten, Ebene Backend / Frontend / **Du**. Prüfen, bevor du zeigst: Steckt jede AC in einer Aufgabe? Hat jede Aufgabe einen Abschluss, den ein Test oder Blick belegen kann?

### 6. Review
Design und Plan zeigen, mit der Abdeckung als kurzer Liste (`AC-1 → listEntries()`, `AC-2 → Leerzustand in EntryList` …): „Ergibt das Sinn? Fragen?" Auf Freigabe warten — **eine** Freigabe für beides.

## Abschluss
- [ ] `Screens & Komponenten`, `Daten & Server` (inkl. Verträge), `Regeln`, `Umgebung` in der Spec gefüllt
- [ ] Jede AC hat einen Träger im Design (oder steht als Lücke unter `Grenzen`)
- [ ] `## Plan` gefüllt; jede AC steckt in mindestens einer Aufgabe; User-Aufgaben (`U…`) mit Ort und Wert-Quelle
- [ ] Decision Log ergänzt; offene Punkte unter `Grenzen`
- [ ] INDEX-Status → Architected; Verlauf-Zeile „Architektur freigegeben"
- [ ] User hat freigegeben

## Handoff
„Design fertig. Frontend und Backend können jetzt **parallel** laufen: `/frontend <ID>` und `/backend <ID>` (Verträge stehen in der Spec). Nur Frontend nötig? Dann nur `/frontend`."

## Commit
```
docs(<ID>): Add technical design for [feature]
```
