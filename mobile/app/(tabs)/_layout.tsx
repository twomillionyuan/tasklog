import { SymbolView } from "expo-symbols";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { theme } from "@/src/theme/tokens";

export default function TabLayout() {
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

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      screenOptions={{
        animation: "shift",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.colors.background
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          color: theme.colors.text,
          fontFamily: theme.fonts.serif,
          fontSize: 24
        },
        sceneStyle: {
          backgroundColor: theme.colors.background
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.mutedText,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          paddingBottom: 4
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 90,
          paddingTop: 8
        }
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "rectangle.stack.fill",
                android: "list_alt",
                web: "article"
              }}
              tintColor={color}
              size={28}
            />
          )
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "map",
                android: "map",
                web: "map"
              }}
              tintColor={color}
              size={28}
            />
          )
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "plus.circle.fill",
                android: "add_box",
                web: "add"
              }}
              tintColor={color}
              size={28}
            />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "person.crop.circle.fill",
                android: "account_circle",
                web: "account_circle"
              }}
              tintColor={color}
              size={28}
            />
          )
        }}
      />
    </Tabs>
  );
}
