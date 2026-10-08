# Design-System — TrackingApp

> Lesbare Referenz zu `global.css` (Tokens) und `tailwind.config.js` (Klassen). Quelle: Beschreibung im PRD (kein Mockup), umgesetzt mit Apple-Systemfarben und SF Pro.
> Charakter: nativer iOS-Look, ruhig, zahlenlastig. Ein heller Blau-Grau-Verlauf als Bühne, weiße Karten darauf, Farbe nur für Makros und Status.
> Erscheinungsbild folgt dem iPhone (`userInterfaceStyle: automatic`): jede Farbe gibt es light **und** dark.

## Farben

Klassen: `bg-<token>`, `text-<token>`, `border-<token>` — **nie Hex** in Komponenten. Für Props, die keine Klasse nehmen (SVG-`stroke`, `LinearGradient.colors`), den Token-Wert per `hsl(var(--token))` bzw. einen Theme-Hook aus `lib/` lesen.

| Token | Klasse | Light | Dark | Bedeutung |
|-------|--------|-------|------|-----------|
| `--background-top` | `bg-background-top` | `#E1F1FB` · 203 76.5% 93.3% | `#0F1C26` · 206 43.4% 10.4% | Verlauf oben (Haupt-Screen) |
| `--background` | `bg-background` | `#EBEBF0` · 240 14.3% 93.1% | `#000000` · 0 0% 0% | Verlauf unten; einfarbiger Hintergrund sonst |
| `--foreground` | `text-foreground` | `#000000` | `#FFFFFF` | Primärtext, große Zahlen |
| `--card` | `bg-card` | `#FFFFFF` | `#1C1C1E` · 240 3.4% 11.4% | Karten (Bereiche 2–4), formSheets, Listenzellen |
| `--popover` | `bg-popover` | = card | = card | Menüs, Popover der reusables |
| `--muted` | `bg-muted` | `#F2F2F7` · 240 23.8% 95.9% | `#2C2C2E` · 240 2.2% 17.6% | Sekundärflächen, Reiter-Hintergrund, Spur von Fortschrittsringen/-balken |
| `--muted-foreground` | `text-muted-foreground` | `#8A8A8E` · 240 1.7% 54.9% | `#98989F` · 240 3.5% 61% | Sekundärtext: Einheiten, „von 2000 kcal", Mengen, Platzhalter |
| `--secondary`, `--accent` | `bg-secondary`, `bg-accent` | = muted | = muted | nur für reusables-Primitives |
| `--border` | `border-border` | `#C6C6C8` · 240 1.8% 78% | `#38383A` · 240 1.8% 22.4% | Trenner (`border-hairline`) |
| `--input` | `bg-input` / `border-input` | `#E5E5EA` · 240 10.6% 90.8% | `#3A3A3C` · 240 1.7% 23.1% | Eingabefelder, Suchfeld |
| `--primary` | `bg-primary`, `text-primary` | `#007AFF` · 211 100% 50% | `#0A84FF` · 210 100% 52% | Aktionen, „+"-Buttons, Links, ausgewählter Tag in der Zeitleiste |
| `--ring` | `ring-ring` | = primary | = primary | Fokus |
| `--destructive` | `bg-destructive` | `#FF3B30` · 3 100% 59.4% | `#FF453A` · 3 100% 61.4% | Wisch-Löschen (Papierkorb), Ziel überschritten |
| `--success` | `bg-success`, `text-success` | `#34C759` · 135 58.6% 49.2% | `#30D158` · 135 63.6% 50.4% | Ziel erreicht |
| `--carbs` | `bg-carbs`, `text-carbs` | `#30B0C7` · 189 61.1% 48.4% | `#40C8E0` · 189 72.1% 56.5% | Kohlenhydrate (C) — türkis |
| `--fat` | `bg-fat`, `text-fat` | `#AF52DE` · 280 68% 59.6% | `#BF5AF2` · 280 85.4% 65.1% | Fette (F) — lila |
| `--protein` | `bg-protein`, `text-protein` | `#FF9500` · 35 100% 50% | `#FF9F0A` · 36 100% 52% | Eiweiß (E) — orange |

`*-foreground` zu primary/destructive/success ist jeweils Weiß.

**Regeln:** Makrofarben nur für C/F/E (Kürzel, Balken, Ringe), nie für andere Bedeutungen. Kalorien bleiben neutral (`foreground` + `primary` für den Fortschritt). „Überschritten" = `destructive`, nicht die Makrofarbe abdunkeln.

## Typografie

**Schrift:** SF Pro (iOS-Systemschrift) — kein `fontFamily`, nichts zu bündeln, `useFonts` entfällt. Zahlen immer mit `tabular-nums`, damit sie beim Hochzählen nicht springen.

| Klasse | Größe / Zeile | Gewicht | Einsatz |
|--------|---------------|---------|---------|
| `text-large-title` | 34 / 41 | bold | große Kalorienzahl (übrig) |
| `text-title1` | 28 / 34 | bold | Sheet-Titel groß |
| `text-title2` | 22 / 28 | bold | Kartentitel, Makro-Werte |
| `text-title3` | 20 / 25 | semibold | Mahlzeit-Überschrift |
| `text-headline` | 17 / 22 | semibold | Listenzeile Titel, Buttons |
| `text-body` | 17 / 22 | regular | Fließtext, Eingaben |
| `text-callout` | 16 / 21 | regular | Mengen in Listen |
| `text-subhead` | 15 / 20 | regular | Sekundärzeilen, Reiter |
| `text-footnote` | 13 / 18 | regular | Einheiten, „pro 100 g" |
| `text-caption` | 12 / 16 | regular | C / F / E-Kürzel, Wochentage |
| `text-caption2` | 11 / 13 | regular | kleinste Labels |

Gewicht über `font-semibold` / `font-bold` überschreibbar.

## Radius, Spacing, Schatten

- **Radius:** `--radius` = 14 px → `rounded-lg` 14 (Karten, Sheets-Inhalte), `rounded-md` 12 (Felder, Buttons), `rounded-sm` 10 (Chips, Reiter); Kreise `rounded-full`
- **Spacing:** Tailwind-4er-Raster. Bildschirmrand `px-4` (16), Abstand zwischen Karten `gap-3` (12), Karten-Innenabstand `p-4`, Listenzeilen min. 44 pt hoch (Touch-Ziel)
- **Schatten:** Karten nur im Light-Mode leicht: `shadow-sm shadow-black/5`; im Dark-Mode keiner (Kontrast über `card` vs. `background`)

## Komponenten-Notizen

- **Hintergrund Haupt-Screen:** vertikaler Verlauf `background-top` → `background` über die ganze Höhe, hinter der SafeArea
- **formSheets:** alle Unter-Screens als `presentation: 'formSheet'` (Expo Router), Hintergrund `bg-card` bzw. `bg-background` für gruppierte Listen
- **Makro-Anzeige:** Kürzel C / F / E in der Makrofarbe, Wert in `foreground`, Spur `muted`
- **Mahlzeit-Kopfzeile:** nur Gramm, `text-footnote text-muted-foreground`
- **Wisch-Löschen:** Aktion `bg-destructive` mit weißem Papierkorb (SF Symbol `trash.fill` über `expo-symbols`)
- **Hinzufügen-Sheet:** Suchfeld `bg-input rounded-md`, Reiter „Verwendet · Lebensmittel · Mahlzeiten" als Segmented Control auf `bg-muted`

## Buildability

| Element | Flag | RN-Ansatz |
|---------|------|-----------|
| Hintergrund-Verlauf | 🟡 | `expo-linear-gradient` (noch nicht installiert), Farben aus den Tokens lesen |
| Fortschrittsringe Kalorien/Makros | 🟡 | `react-native-svg` (noch nicht installiert; `Circle` + `strokeDasharray`), Farbe per Token |
| Wisch-Löschen | 🟡 | `react-native-gesture-handler` `ReanimatedSwipeable` (beides installiert) |
| formSheet mit Detents | ✅ | Expo Router `presentation: 'formSheet'`, `sheetAllowedDetents` |
| Segmented Control (Reiter) | ✅ | eigene Komposition aus `Pressable` oder reusables `Tabs` |
| Zeitleiste (horizontal) | ✅ | `FlatList horizontal` |
| SF Symbols | ✅ | `expo-symbols` (installiert) |
| Karten, Listen, Typo, Farben | ✅ | NativeWind-Klassen |
