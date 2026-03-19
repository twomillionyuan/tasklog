import MapView, { Marker } from "react-native-maps";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { useAuth } from "@/src/context/AuthContext";
import { getSpots } from "@/src/lib/api";
import { theme } from "@/src/theme/tokens";
import type { Spot } from "@/src/types/api";

export default function MapScreen() {
  const { token } = useAuth();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!token) {
        return;
      }

      setLoading(true);

      try {
        const loadedSpots = await getSpots(token);
        setSpots(loadedSpots);
        setSelectedSpot(loadedSpots[0] ?? null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  const initialSpot = selectedSpot ?? spots[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Map View</Text>
          <Text style={styles.title}>Your places on one surface</Text>
        </View>

        <View style={styles.mapFrame}>
          {loading ? (
            <View style={styles.mapOverlay}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.mapOverlayBody}>Loading your saved places...</Text>
            </View>
          ) : initialSpot ? (
            <MapView
              initialRegion={{
                latitude: initialSpot.latitude,
                longitude: initialSpot.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08
              }}
              style={StyleSheet.absoluteFillObject}
            >
              {spots.map((spot) => (
                <Marker
                  coordinate={{
                    latitude: spot.latitude,
                    longitude: spot.longitude
                  }}
                  key={spot.id}
                  onPress={() => setSelectedSpot(spot)}
                  pinColor={spot.favorited ? theme.colors.accent : "#8C9A8B"}
                  title={spot.title}
                />
              ))}
            </MapView>
          ) : (
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayTitle}>No spots yet</Text>
              <Text style={styles.mapOverlayBody}>
                Save your first place and it will appear on the map.
              </Text>
            </View>
          )}
        </View>

        {selectedSpot ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Selected pin</Text>
            <Text style={styles.previewTitle}>{selectedSpot.title}</Text>
            <Text style={styles.previewBody}>{selectedSpot.note}</Text>
            <Link href={`/spot/${selectedSpot.id}` as const} asChild>
              <Pressable style={styles.previewButton}>
                <Text style={styles.previewButtonLabel}>Open detail</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}
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
  mapOverlay: {
    backgroundColor: "rgba(248, 244, 236, 0.92)",
    borderRadius: 22,
    gap: 8,
    bottom: 18,
    left: 18,
    alignItems: "center",
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
