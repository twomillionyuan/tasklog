import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { useAuth } from "@/src/context/AuthContext";
import { getActivity } from "@/src/lib/api";
import { formatSpotDate } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { ActivityEvent } from "@/src/types/api";

export default function ProfileScreen() {
  const { signOut, token, user } = useAuth();
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const authToken = token;

    async function loadActivity() {
      try {
        const response = await getActivity(authToken);
        setActivity(response);
        setActivityError(null);
      } catch (requestError) {
        setActivityError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load sync activity"
        );
      }
    }

    void loadActivity();

    const interval = setInterval(() => {
      void loadActivity();
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

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
          <Text style={styles.sectionTitle}>Account status</Text>
          <Text style={styles.item}>Auth token stored securely on device</Text>
          <Text style={styles.item}>Spots sync against the OSC-hosted API</Text>
          <Text style={styles.item}>Photos upload into OSC object storage</Text>
          <Text style={styles.item}>Location capture uses the current GPS position</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync activity</Text>
          <Text style={styles.item}>
            Recent spot events are mirrored into OSC CouchDB for sync-friendly activity logs.
          </Text>
          {activityError ? <Text style={styles.item}>{activityError}</Text> : null}
          {activity.length === 0 ? (
            <Text style={styles.item}>No activity recorded yet.</Text>
          ) : (
            activity.slice(0, 5).map((entry) => (
              <Text key={entry.id} style={styles.item}>
                {entry.type.toUpperCase()} {entry.title} • {formatSpotDate(entry.createdAt)}
              </Text>
            ))
          )}
        </View>

        <Pressable
          onPress={() => {
            void signOut();
          }}
          style={styles.button}
        >
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
