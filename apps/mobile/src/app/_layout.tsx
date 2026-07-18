import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { initKakao } from "@/features/auth/kakao";
import { colors } from "@/design-system/tokens";

export default function RootLayout() {
  useEffect(() => {
    initKakao().catch((e) => console.warn("[kakao] init failed:", e));
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
