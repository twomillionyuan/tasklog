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
          title: "Overview",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "square.grid.2x2.fill",
                android: "dashboard",
                web: "dashboard"
              }}
              size={28}
              tintColor={color}
            />
          )
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Lists",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "list.bullet.rectangle.fill",
                android: "view_list",
                web: "view_list"
              }}
              size={28}
              tintColor={color}
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
              size={28}
              tintColor={color}
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
              size={28}
              tintColor={color}
            />
          )
        }}
      />
    </Tabs>
  );
}
