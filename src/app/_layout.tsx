import { useEffect } from "react";

import { PortalHost } from "@rn-primitives/portal";
import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "@/constants/config/amplify";
import "@/global.css";
import { useAuth } from "@/hooks/useAuth";
import { useCustomColorScheme } from "@/hooks/useCustomColorScheme";
import { NAV_THEME } from "@/lib/theme";
import { AuthProvider } from "@/providers/AuthProvider";

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { session, loading } = useAuth();
  const { colorScheme } = useCustomColorScheme();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />

        <Stack.Protected guard={session}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>

        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    // Required by react-native-gesture-handler. Without this, the swipeable
    // date cards never receive gestures, most visibly on Android.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppStack />
      </AuthProvider>
      {/* Mount point for @rn-primitives portals (dialogs, alert dialogs). */}
      <PortalHost />
    </GestureHandlerRootView>
  );
}
