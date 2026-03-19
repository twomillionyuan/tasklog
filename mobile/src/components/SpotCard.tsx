import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatSpotDate } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { Spot } from "@/src/types/api";

export function SpotCard({ spot }: { spot: Spot & { accentColor?: string } }) {
  return (
    <Link href={`/spot/${spot.id}` as const} asChild>
      <Pressable style={styles.card}>
        <View
          style={[
            styles.image,
            { backgroundColor: spot.accentColor ?? theme.colors.surfaceMuted }
          ]}
        />
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.title}>{spot.title}</Text>
            {spot.favorited ? <Text style={styles.favorite}>★</Text> : null}
          </View>
          <Text numberOfLines={2} style={styles.note}>
            {spot.note}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{formatSpotDate(spot.createdAt)}</Text>
            <Text style={styles.meta}>{spot.photos.length} photos</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 26,
    overflow: "hidden"
  },
  image: {
    height: 190
  },
  content: {
    gap: 10,
    padding: 18
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  title: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.serif,
    fontSize: 24
  },
  favorite: {
    color: theme.colors.accent,
    fontSize: 18
  },
  note: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  meta: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  }
});
