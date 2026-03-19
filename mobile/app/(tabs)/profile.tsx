import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { theme } from "@/src/theme/tokens";

export default function ProfileScreen() {
  const { signOut, user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>EA</Text>
          </View>
          <Text style={styles.name}>SpotLog Account</Text>
          <Text style={styles.email}>{user?.email ?? "No account loaded"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Build checklist</Text>
          <Text style={styles.item}>Auth screens scaffolded</Text>
          <Text style={styles.item}>Feed and map routes scaffolded</Text>
          <Text style={styles.item}>Create flow prepared for photo + GPS</Text>
          <Text style={styles.item}>API integration next</Text>
        </View>

        <Pressable onPress={signOut} style={styles.button}>
          <Text style={styles.buttonLabel}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  container: {
    flex: 1,
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 16
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    gap: 8,
    padding: 24
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    height: 74,
    justifyContent: "center",
    width: 74
  },
  avatarLabel: {
    color: theme.colors.background,
    fontSize: 24,
    fontWeight: "700"
  },
  name: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 28
  },
  email: {
    color: theme.colors.subtleText,
    fontSize: 15
  },
  section: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 24,
    gap: 10,
    padding: 18
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  item: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22
  },
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    marginTop: "auto",
    paddingVertical: 16
  },
  buttonLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
  }
});
