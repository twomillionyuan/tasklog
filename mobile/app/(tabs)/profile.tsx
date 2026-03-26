import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { getDashboard, getLists } from "@/src/lib/api";
import { formatCompletion } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { Dashboard, TaskList } from "@/src/types/api";

export default function ProfileScreen() {
  const { token, user, signOut } = useAuth();
  const isFocused = useIsFocused();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [lists, setLists] = useState<TaskList[]>([]);
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
      const [nextDashboard, nextLists] = await Promise.all([
        getDashboard(token),
        getLists(token)
      ]);

      setDashboard(nextDashboard);
      setLists(nextLists);
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
        <View style={styles.header}>
          <Text style={styles.kicker}>Profile</Text>
          <Text style={styles.title}>Progress that stays visible</Text>
          <Text style={styles.subtitle}>
            Track how much you have completed and which lists still carry the most unfinished work.
          </Text>
        </View>

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
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total tasks</Text>
                <Text style={styles.metricValue}>{dashboard.summary.totalTasks}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Overdue</Text>
                <Text style={styles.metricValue}>{dashboard.summary.overdueTasks}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Due today</Text>
                <Text style={styles.metricValue}>{dashboard.summary.dueTodayTasks}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Completion</Text>
                <Text style={styles.metricValue}>{dashboard.summary.completionRate}%</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By list</Text>
              {lists.map((list) => (
                <View key={list.id} style={styles.listRow}>
                  <View style={styles.listRowTop}>
                    <View style={styles.listTitleRow}>
                      <View style={[styles.listDot, { backgroundColor: list.color }]} />
                      <Text style={styles.listName}>{list.name}</Text>
                    </View>
                    <Text style={styles.listValue}>
                      {formatCompletion(list.summary.completed, list.summary.total)}
                    </Text>
                  </View>
                  <Text style={styles.listMeta}>
                    {list.summary.completed} completed, {list.summary.open} open, {list.summary.overdue} overdue
                  </Text>
                </View>
              ))}
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
  header: {
    gap: 8,
    marginTop: 8
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
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  accountValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  summaryCard: {
    backgroundColor: theme.colors.cardAccent,
    borderRadius: 28,
    gap: 10,
    padding: 22
  },
  summaryEyebrow: {
    color: theme.colors.backgroundMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  summaryValue: {
    color: theme.colors.background,
    fontFamily: theme.fonts.serif,
    fontSize: 46
  },
  summaryBody: {
    color: theme.colors.background,
    fontSize: 15,
    lineHeight: 22
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
    fontSize: 13,
    fontWeight: "600"
  },
  metricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 28
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 28
  },
  listRow: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  listRowTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  listTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  listDot: {
    borderRadius: 999,
    height: 12,
    width: 12
  },
  listName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  listValue: {
    color: theme.colors.subtleText,
    fontSize: 13,
    fontWeight: "700"
  },
  listMeta: {
    color: theme.colors.subtleText,
    fontSize: 14
  },
  signOutButton: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    paddingVertical: 16
  },
  signOutLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
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
    fontFamily: theme.fonts.serif,
    fontSize: 22
  },
  stateText: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  }
});
