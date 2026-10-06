# Vendored Expo Skills (Attribution)

These skills are copied from the official **expo/skills** repository
(<https://github.com/expo/skills>), **MIT-licensed, © Expo**:

- `expo-deployment/` — EAS Build/Submit, App Store, TestFlight, Play Store, web
- `upgrading-expo/` — Expo SDK upgrades + deprecated-package migrations

They supply authoritative, up-to-date Expo/EAS **reference knowledge**. Our own
workflow skills orchestrate around them — e.g. `/deploy` handles the workflow
glue (QA gate, tiers, tracking) and delegates the actual EAS mechanics to
`expo-deployment`.

Two upstream skills are intentionally not vendored here, both still live in the
template, re-copy either if the underlying need shows up:
- `eas-update-insights` (OTA update health) — no `expo-updates`/OTA configured.
- `native-data-fetching` (external/non-Supabase networking) — the app has no
  direct client-to-third-party API calls; everything with a secret already
  goes through a Supabase Edge Function per `.claude/rules/backend.md`.

The upstream Codex `agents/openai.yaml` metadata was omitted (not used by Claude
Code). To refresh: re-copy from upstream. Upstream license: MIT.
