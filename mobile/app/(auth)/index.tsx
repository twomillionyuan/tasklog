import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { theme } from "@/src/theme/tokens";

export default function AuthIndexScreen() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.background,
          flex: 1,
          justifyContent: "center"
        }}
      >
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/feed" />;
  }

  return <Redirect href="/(auth)/login" />;
}
