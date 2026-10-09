import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-4">
        {/* Vorläufiger Zugang zu den eigenen Lebensmitteln (PROJ-2) — entfernt PROJ-7. */}
        <Button
          onPress={() => router.push("/foods")}
          className="h-[50px] px-6"
          accessibilityLabel="Eigene Lebensmittel"
          accessibilityHint="Öffnet die Liste der eigenen Lebensmittel"
        >
          <Text className="text-headline font-semibold">Eigene Lebensmittel</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
