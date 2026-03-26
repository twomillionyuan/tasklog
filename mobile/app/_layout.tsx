import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/src/context/AuthContext";
import { theme } from "@/src/theme/tokens";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)"
};

export default function RootLayout() {
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      border: theme.colors.border,
      card: theme.colors.surface,
      primary: theme.colors.accent,
      text: theme.colors.text
    }
  };

  return (
    <AuthProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="list/[id]"
            options={{
              headerTintColor: theme.colors.text,
              headerTitleStyle: {
                color: theme.colors.text
              }
            }}
          />
          <Stack.Screen
            name="task/edit/[id]"
            options={{
              headerTintColor: theme.colors.text,
              headerTitleStyle: {
                color: theme.colors.text
              }
            }}
          />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
