import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { mockSpots } from "@/src/data/mockSpots";
import { theme } from "@/src/theme/tokens";

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Map View</Text>
          <Text style={styles.title}>Your places on one surface</Text>
        </View>

        <View style={styles.mapFrame}>
          {mockSpots.map((spot, index) => (
            <View
              key={spot.id}
              style={[
                styles.pin,
                {
                  backgroundColor: spot.accentColor,
                  left: `${18 + index * 22}%`,
                  top: `${20 + (index % 2) * 26}%`
                }
              ]}
            />
          ))}
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayTitle}>Interactive map comes next</Text>
            <Text style={styles.mapOverlayBody}>
              This scaffold reserves the route and visual behavior for the real
              map screen.
            </Text>
          </View>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Selected pin</Text>
          <Text style={styles.previewTitle}>{mockSpots[1].title}</Text>
          <Text style={styles.previewBody}>{mockSpots[1].note}</Text>
          <Link href="/spot/2" asChild>
            <Pressable style={styles.previewButton}>
              <Text style={styles.previewButtonLabel}>Open detail</Text>
            </Pressable>
          </Link>
        </View>
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
    paddingTop: 8
  },
  header: {
    gap: 8
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 32,
    lineHeight: 40
  },
  mapFrame: {
    backgroundColor: theme.colors.mapSurface,
    borderRadius: 30,
    flex: 1,
    overflow: "hidden",
    position: "relative"
  },
  pin: {
    borderColor: theme.colors.background,
    borderRadius: 999,
    borderWidth: 3,
    height: 20,
    position: "absolute",
    width: 20
  },
  mapOverlay: {
    backgroundColor: "rgba(248, 244, 236, 0.92)",
    borderRadius: 22,
    bottom: 18,
    left: 18,
    padding: 16,
    position: "absolute",
    right: 18
  },
  mapOverlayTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6
  },
  mapOverlayBody: {
    color: theme.colors.subtleText,
    fontSize: 14,
    lineHeight: 20
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    gap: 8,
    padding: 18
  },
  previewLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  previewTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 24
  },
  previewBody: {
    color: theme.colors.subtleText,
    fontSize: 14,
    lineHeight: 20
  },
  previewButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.text,
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  previewButtonLabel: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: "700"
  }
});
