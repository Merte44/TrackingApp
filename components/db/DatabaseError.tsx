import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { DbInitError } from "@/lib/db";

interface DatabaseErrorProps {
  error: DbInitError;
  retrying: boolean;
  onRetry: () => void;
}

/** Vollbild-Hinweis, wenn die Datenbank beim Start nicht bereit wird (Spec PROJ-1, Regeln). */
export function DatabaseError({ error, retrying, onRetry }: DatabaseErrorProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-6 px-4">
        <View className="gap-3 rounded-lg bg-card p-4 shadow-sm shadow-black/5 dark:shadow-none">
          <Text className="text-title2" accessibilityRole="header">
            Daten nicht verfügbar
          </Text>
          <Text className="text-body">{error.message}</Text>
          {error.detail ? (
            <Text className="text-footnote text-muted-foreground" selectable>
              {error.detail}
            </Text>
          ) : null}
        </View>
        <Button
          onPress={onRetry}
          disabled={retrying}
          accessibilityLabel="Erneut versuchen"
          accessibilityHint="Versucht erneut, die Datenbank zu öffnen und umzustellen"
          accessibilityState={{ disabled: retrying, busy: retrying }}
        >
          <Text className="text-headline font-semibold">{retrying ? "Wird versucht …" : "Erneut versuchen"}</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
