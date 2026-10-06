import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

/**
 * Supabase client for Expo / React Native.
 *
 * Session is persisted in the encrypted iOS Keychain / Android Keystore via
 * expo-secure-store — never in plain AsyncStorage (see .claude/rules/security.md).
 *
 * Setup: copy `.env.local.example` → `.env.local` and fill in your project's
 * URL + anon key (Supabase Dashboard → Project Settings → API). Only
 * `EXPO_PUBLIC_*` vars reach the app bundle — and are effectively public, which
 * is fine for the anon key (RLS is the real authorization layer).
 *
 * Gotcha: expo-secure-store caps a value at ~2048 bytes. Standard Supabase
 * sessions fit; if you add large custom claims and persistence breaks, switch
 * to a chunked SecureStore adapter.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.local.example → .env.local and set " +
      "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection on native (that's a web-only concept).
    detectSessionInUrl: false,
  },
});

// Tip: for reliable token refresh, start/stop auto-refresh on AppState changes —
// supabase.auth.startAutoRefresh() when active, stopAutoRefresh() when backgrounded.
// See https://supabase.com/docs/guides/auth/quickstarts/react-native
