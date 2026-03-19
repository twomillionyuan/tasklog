import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useEffect, useState } from "react";

import { useAuth } from "@/src/context/AuthContext";
import { deleteSpot, getSpot } from "@/src/lib/api";
import { formatSpotDate } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { Spot } from "@/src/types/api";

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token || !id) {
        return;
      }

      setLoading(true);

      try {
        const response = await getSpot(token, id);
        setSpot(response);
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Could not load spot"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, token]);

  async function handleDelete() {
    if (!token || !spot) {
      return;
    }

    setDeleting(true);

    try {
      await deleteSpot(token, spot.id);
      router.replace("/(tabs)/feed");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not delete spot"
      );
      setDeleting(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{ title: spot?.title ?? "Spot", headerBackTitle: "Back" }}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.note}>Loading spot...</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={styles.stateCard}>
              <Text style={styles.sectionTitle}>Could not load spot</Text>
              <Text style={styles.note}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error && spot ? (
            <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.heroStrip}
          >
            {(spot.photos.length > 0 ? spot.photos : [{ id: "placeholder", imageUrl: "", storageKey: "", createdAt: spot.createdAt }]).map((photo) =>
              photo.imageUrl ? (
                <Image
                  key={photo.id}
                  source={{ uri: photo.imageUrl }}
                  style={styles.heroImage}
                />
              ) : (
                <View
                  key={photo.id}
                  style={[
                    styles.heroImage,
                    {
                      backgroundColor: theme.colors.surfaceMuted
                    }
                  ]}
                />
              )
            )}
          </ScrollView>

          <View style={styles.heroBadge}>
            <Text style={styles.heroImageLabel}>{spot.photos.length} photos</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.title}>{spot.title}</Text>
            <Text style={styles.meta}>
              {formatSpotDate(spot.createdAt)} • {spot.latitude}, {spot.longitude}
            </Text>
            <Text style={styles.note}>{spot.note}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mini map</Text>
            <MapView
              initialRegion={{
                latitude: spot.latitude,
                longitude: spot.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02
              }}
              pointerEvents="none"
              style={styles.miniMap}
            >
              <Marker
                coordinate={{
                  latitude: spot.latitude,
                  longitude: spot.longitude
                }}
                pinColor={theme.colors.accent}
              />
            </MapView>
          </View>

          <Link href={`/spot/edit/${spot.id}` as const} asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonLabel}>Edit Spot</Text>
            </Pressable>
          </Link>
          <Pressable
            disabled={deleting}
            onPress={handleDelete}
            style={[styles.secondaryButton, deleting && styles.buttonDisabled]}
          >
            <Text style={styles.secondaryButtonLabel}>
              {deleting ? "Deleting..." : "Delete Spot"}
            </Text>
          </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 18
  },
  heroStrip: {
    marginTop: 8
  },
  heroImage: {
    borderRadius: 32,
    height: 280,
    marginRight: 12,
    width: 320
  },
  heroBadge: {
    alignSelf: "flex-end",
    marginTop: -58,
    zIndex: 1
  },
  heroImageLabel: {
    backgroundColor: "rgba(248, 244, 236, 0.9)",
    borderRadius: 999,
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    gap: 10,
    padding: 20
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 30
  },
  meta: {
    color: theme.colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4
  },
  note: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 24
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  miniMap: {
    borderRadius: 20,
    height: 160,
    overflow: "hidden"
  },
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    paddingVertical: 16
  },
  buttonLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16
  },
  secondaryButtonLabel: {
    color: "#A04B41",
    fontSize: 15,
    fontWeight: "700"
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    gap: 10,
    padding: 24
  },
  buttonDisabled: {
    opacity: 0.7
  }
});
