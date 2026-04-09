import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { getActivity, getDashboard } from "@/src/lib/api";
import { formatDateTime } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { ActivityEvent, Dashboard } from "@/src/types/api";

function formatActivityLabel(event: ActivityEvent) {
  if (event.type === "attached") {
    return event.entityType === "task" ? "Photo added" : "Cover image added";
  }

  if (event.type === "created") {
    return event.entityType === "task" ? "Task created" : "List created";
  }

  if (event.type === "completed") {
    return "Task completed";
  }

  if (event.type === "deleted") {
    return event.entityType === "task" ? "Task deleted" : "List deleted";
  }

  return event.entityType === "task" ? "Task updated" : "List updated";
}

export default function ProfileScreen() {
  const { token, user, signOut } = useAuth();
  const isFocused = useIsFocused();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(nextRefreshing = false) {
    if (!token) {
      return;
    }

    if (nextRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [nextDashboard, nextActivity] = await Promise.all([
        getDashboard(token),
        getActivity(token)
      ]);

      setDashboard(nextDashboard);
      setActivity(nextActivity);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load account stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void load();
  }, [token, isFocused]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>Signed in as</Text>
          <Text style={styles.accountValue}>{user?.email ?? "Unknown user"}</Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.stateText}>Loading your stats...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load stats</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && dashboard ? (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryEyebrow}>Completed tasks</Text>
              <Text style={styles.summaryValue}>{dashboard.summary.completedTasks}</Text>
              <Text style={styles.summaryBody}>
                {dashboard.summary.openTasks} still open across {dashboard.summary.listCount} lists.
              </Text>
            </View>

            <View style={styles.grid}>
              <Link href={"/(tabs)/lists" as never} asChild>
                <Pressable style={({ pressed }) => [styles.metricCard, pressed && styles.cardPressed]}>
                  <Text style={styles.metricLabel}>Total tasks</Text>
                  <Text style={styles.metricValue}>{dashboard.summary.totalTasks}</Text>
                </Pressable>
              </Link>
              <Link href={"/(tabs)/lists" as never} asChild>
                <Pressable style={({ pressed }) => [styles.metricCard, pressed && styles.cardPressed]}>
                  <Text style={styles.metricLabel}>Overdue</Text>
                  <Text style={styles.metricValue}>{dashboard.summary.overdueTasks}</Text>
                </Pressable>
              </Link>
              <Link href={"/(tabs)/lists" as never} asChild>
                <Pressable style={({ pressed }) => [styles.metricCard, pressed && styles.cardPressed]}>
                  <Text style={styles.metricLabel}>Due today</Text>
                  <Text style={styles.metricValue}>{dashboard.summary.dueTodayTasks}</Text>
                </Pressable>
              </Link>
              <Link href={"/(tabs)/lists" as never} asChild>
                <Pressable style={({ pressed }) => [styles.metricCard, pressed && styles.cardPressed]}>
                  <Text style={styles.metricLabel}>Completion</Text>
                  <Text style={styles.metricValue}>{dashboard.summary.completionRate}%</Text>
                </Pressable>
              </Link>
            </View>

            <View style={styles.activitySection}>
              <Text style={styles.activityTitle}>Recent activity</Text>
              {activity.length === 0 ? (
                <View style={styles.activityCard}>
                  <Text style={styles.activityBody}>No recent synced activity yet.</Text>
                </View>
              ) : (
                activity.slice(0, 6).map((event) => (
                  <View key={event.id} style={styles.activityCard}>
                    <Text style={styles.activityEventTitle}>{event.title}</Text>
                    <Text style={styles.activityBody}>
                      {formatActivityLabel(event)} · {formatDateTime(event.createdAt)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  content: {
    gap: 18,
    paddingBottom: 32,
    paddingHorizontal: 20
  },
  accountCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    padding: 18
  },
  accountLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    textTransform: "uppercase"
  },
  accountValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 18,
  },
  summaryCard: {
    backgroundColor: theme.colors.cardAccent,
    borderRadius: 24,
    gap: 6,
    padding: 16
  },
  summaryEyebrow: {
    color: theme.colors.backgroundMuted,
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  summaryValue: {
    color: theme.colors.background,
    fontFamily: theme.fonts.medium,
    fontSize: 30,
    lineHeight: 34
  },
  summaryBody: {
    color: theme.colors.background,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: "47%",
    gap: 8,
    padding: 16
  },
  metricLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  metricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 28
  },
  cardPressed: {
    opacity: 0.86
  },
  activitySection: {
    gap: 10
  },
  activityTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 24
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    padding: 14
  },
  activityEventTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 15,
  },
  activityBody: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18
  },
  signOutButton: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    paddingVertical: 16
  },
  signOutLabel: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 20
  },
  stateTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 22
  },
  stateText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  }
});
