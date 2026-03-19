import { useDeferredValue, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { SpotCard } from "@/src/components/SpotCard";
import { useAuth } from "@/src/context/AuthContext";
import { getSpots } from "@/src/lib/api";
import { theme } from "@/src/theme/tokens";
import type { Spot } from "@/src/types/api";

export default function FeedScreen() {
  const { token } = useAuth();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [search, setSearch] = useState("");
  const [favoritedOnly, setFavoritedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  async function loadSpots(nextRefreshing = false) {
    if (!token) {
      return;
    }

    if (nextRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getSpots(token, {
        search: deferredSearch,
        favorited: favoritedOnly ? true : undefined
      });

      setSpots(response);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load your spots"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSpots();
  }, [token, deferredSearch, favoritedOnly]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadSpots(true)} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Your Journal</Text>
          <Text style={styles.title}>Recent spots</Text>
          <Text style={styles.subtitle}>
            Scrollable feed, newest first, with search and quick filters.
          </Text>
        </View>

        <TextInput
          placeholder="Search title or note"
          placeholderTextColor={theme.colors.mutedText}
          onChangeText={setSearch}
          style={styles.search}
          value={search}
        />

        <View style={styles.filters}>
          <Pressable
            onPress={() => setFavoritedOnly((current) => !current)}
            style={[
              styles.filterChip,
              favoritedOnly && styles.filterChipActive
            ]}
          >
            <Text
              style={[
                styles.filterChipLabel,
                favoritedOnly && styles.filterChipLabelActive
              ]}
            >
              Favorites
            </Text>
          </Pressable>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipLabel}>This month</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipLabel}>Stockholm</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.stateText}>Loading your spots...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load spots</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={() => loadSpots()} style={styles.retryButton}>
              <Text style={styles.retryButtonLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && spots[0] ? (
          <View style={styles.featuredCard}>
            <Text style={styles.featuredLabel}>Featured memory</Text>
            <Text style={styles.featuredTitle}>{spots[0].title}</Text>
            <Text style={styles.featuredBody}>{spots[0].note}</Text>
          </View>
        ) : null}

        {!loading && !error && spots.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No spots yet</Text>
            <Text style={styles.stateText}>
              Create your first place from the Add tab and it will appear here.
            </Text>
          </View>
        ) : null}

        {!loading && !error ? (
          <View style={styles.list}>
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </View>
        ) : null}
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
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 18
  },
  header: {
    marginTop: 8,
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
    fontSize: 34
  },
  subtitle: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22
  },
  search: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 15
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipLabel: {
    color: theme.colors.subtleText,
    fontSize: 13,
    fontWeight: "600"
  },
  filterChipActive: {
    backgroundColor: theme.colors.cardAccent
  },
  filterChipLabelActive: {
    color: theme.colors.background
  },
  featuredCard: {
    backgroundColor: theme.colors.cardAccent,
    borderRadius: 28,
    padding: 22,
    gap: 10
  },
  featuredLabel: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  featuredTitle: {
    color: theme.colors.background,
    fontFamily: theme.fonts.serif,
    fontSize: 28
  },
  featuredBody: {
    color: theme.colors.backgroundMuted,
    fontSize: 15,
    lineHeight: 22
  },
  list: {
    gap: 16
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    gap: 10,
    padding: 24
  },
  stateTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 24
  },
  stateText: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  },
  retryButton: {
    backgroundColor: theme.colors.text,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  retryButtonLabel: {
    color: theme.colors.background,
    fontSize: 13,
    fontWeight: "700"
  }
});
