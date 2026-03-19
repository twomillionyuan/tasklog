import { Link, Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { formatSpotDate } from "@/src/lib/format";
import { mockSpots } from "@/src/data/mockSpots";
import { theme } from "@/src/theme/tokens";

function CTAButton({
  href,
  label,
  variant = "primary"
}: {
  href: "/(auth)/login" | "/(auth)/register";
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={[
          styles.button,
          variant === "primary" ? styles.primaryButton : styles.secondaryButton
        ]}
      >
        <Text
          style={[
            styles.buttonLabel,
            variant === "primary"
              ? styles.primaryButtonLabel
              : styles.secondaryButtonLabel
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

export default function WelcomeScreen() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/feed" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SpotLog</Text>
          <Text style={styles.title}>Keep the places you want to remember.</Text>
          <Text style={styles.body}>
            A private photo journal for your walks, travels, and small places
            that matter.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <CTAButton href="/(auth)/register" label="Create Account" />
          <CTAButton href="/(auth)/login" label="Sign In" variant="secondary" />
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>What the app will include</Text>
          <View style={styles.previewRow}>
            <View style={styles.previewPill}>
              <Text style={styles.previewPillLabel}>Map view</Text>
            </View>
            <View style={styles.previewPill}>
              <Text style={styles.previewPillLabel}>Multi-photo spots</Text>
            </View>
            <View style={styles.previewPill}>
              <Text style={styles.previewPillLabel}>Favorites</Text>
            </View>
          </View>
          <View style={styles.previewStack}>
            {mockSpots.slice(0, 2).map((spot) => (
              <View key={spot.id} style={styles.previewSpot}>
                <View
                  style={[
                    styles.previewImage,
                    { backgroundColor: spot.accentColor }
                  ]}
                />
                <View style={styles.previewMeta}>
                  <Text style={styles.previewSpotTitle}>{spot.title}</Text>
                  <Text style={styles.previewSpotText}>{spot.note}</Text>
                  <Text style={styles.previewSpotDate}>
                    {formatSpotDate(spot.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24
  },
  hero: {
    marginTop: 24,
    gap: 14
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 40,
    lineHeight: 48
  },
  body: {
    color: theme.colors.subtleText,
    fontSize: 16,
    lineHeight: 24
  },
  buttonRow: {
    gap: 12
  },
  button: {
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  primaryButton: {
    backgroundColor: theme.colors.text
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "700"
  },
  primaryButtonLabel: {
    color: theme.colors.background
  },
  secondaryButtonLabel: {
    color: theme.colors.text
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    padding: 20,
    gap: 18
  },
  previewTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 24
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  previewPill: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  previewPillLabel: {
    color: theme.colors.subtleText,
    fontSize: 13,
    fontWeight: "600"
  },
  previewStack: {
    gap: 12
  },
  previewSpot: {
    flexDirection: "row",
    gap: 12
  },
  previewImage: {
    borderRadius: 18,
    height: 84,
    width: 76
  },
  previewMeta: {
    flex: 1,
    gap: 6,
    justifyContent: "center"
  },
  previewSpotTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  previewSpotText: {
    color: theme.colors.subtleText,
    fontSize: 14,
    lineHeight: 20
  },
  previewSpotDate: {
    color: theme.colors.mutedText,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase"
  }
});
