import { Link, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/theme/tokens";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>This route does not exist.</Text>
          <Text style={styles.body}>
            The navigation shell is in place, but this screen has not been built
            yet.
          </Text>
          <Link href="/(tabs)/feed" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonLabel}>Go to feed</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 34,
    marginBottom: 10
  },
  body: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18
  },
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.text,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  buttonLabel: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: "700"
  }
});
