---
paths:
  - "components/**"
  - "app/**/*.tsx"
  - "hooks/**"
---

# Frontend-Regeln

## Komponenten-Modell (ehrlich)
- **react-native-reusables sind die Basis-Primitives** — Button, Input, Label, Text, Card, Badge, Switch, Dialog, … — on demand installiert nach `components/ui/`: `npx @react-native-reusables/cli@latest add <name>` (bei CLI-Änderungen: https://www.react-native-reusables.com)
- **Eigene Kompositionen sind erwünscht** und gehören nach `components/<domain>/` (z. B. `components/rounds/round-card.tsx`). Sie setzen sich aus Primitives zusammen
- **Verboten ist nur das Duplizieren eines Primitives:** kein eigener Button/Input/Switch neben dem aus `components/ui/`. Vor jedem neuen Primitive `ls components/ui/` prüfen
- Vor jeder Komposition prüfen, ob es sie schon gibt: `git ls-files components/`

## Design-Quelle
- **Look** kommt aus den Tokens: `global.css` + `tailwind.config.js`, Referenz `docs/design-system.md`. Klassen wie `bg-background`, `text-foreground`, `border-border`, `bg-primary`, `rounded-lg`. **Nie Hex, nie rohe Pixel-Radien** in Komponenten
- **Layout** kommt aus der Screen-Datei des Features: `docs/design/screens/<ID>.html` (Sektion **Design** der Spec). Nur diese Datei lesen — nie das Gesamt-Mockup `docs/design/mockup.html`
- Neue Farben, Fonts, Radien zuerst in die Token-Dateien (light + dark), dann konsumieren. Fonts über `expo-font` bündeln — ein nur in CSS benannter Font existiert in RN nicht

## Standards
- Styling ausschließlich via NativeWind `className`; `style={{}}` nur für dynamisch berechnete Werte
- RN-Primitives: `View`, `Text`, `Pressable`, `Image`, `ScrollView`, `FlatList` — kein `div`/`button`/`span`; `onPress`, nie `onClick`
- `SafeAreaView` (react-native-safe-area-context) um Screen-Inhalt; `KeyboardAvoidingView` (iOS `padding`) bei Text-Inputs
- Listen > ~10 Einträge mit `FlatList` (oder FlashList), nie `.map()`
- Loading-, Error- und Empty-State immer implementieren
- Accessibility: `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` auf interaktiven Elementen
- TypeScript-Interfaces für alle Props; kleine, fokussierte Komponenten
- iPhone-first; iPad- und Android-Politur ist expliziter Follow-up nach iPhone-Freigabe

## Auth (Supabase + Expo)
- Nach Login `router.replace("/")` (kein Zurück zum Login); erst navigieren, wenn `data.session` existiert
- Loading-State in allen Pfaden zurücksetzen (success, error, finally)
- Session liegt im `expo-secure-store`-Adapter des Clients (`lib/supabase.ts`)
