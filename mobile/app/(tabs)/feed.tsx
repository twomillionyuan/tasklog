import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskCard } from "@/src/components/TaskCard";
import { useAuth } from "@/src/context/AuthContext";
import { getDashboard, getLists, updateTask } from "@/src/lib/api";
import { formatCompletion } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { Dashboard, TaskList } from "@/src/types/api";

export default function FeedScreen() {
  const { token } = useAuth();
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
      setError(
        requestError instanceof Error ? requestError.message : "Could not load your overview"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleToggle(taskId: string, nextCompleted: boolean) {
    if (!token) {
      return;
    }

    await updateTask(token, taskId, {
      completed: nextCompleted
    });

    await load();
  }

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void load();
  }, [token, isFocused]);

  const listNameById = new Map(lists.map((list) => [list.id, list.name]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Overview</Text>
          <Text style={styles.title}>What needs attention now</Text>
          <Text style={styles.subtitle}>
            Rank tasks by urgency and due date, then keep the quick wins and late items visible.
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.stateText}>Loading your task overview...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load overview</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={() => load()} style={styles.retryButton}>
              <Text style={styles.retryButtonLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && dashboard ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Completion rate</Text>
              <Text style={styles.heroValue}>{dashboard.summary.completionRate}%</Text>
              <Text style={styles.heroBody}>
                {dashboard.summary.completedTasks} completed out of {dashboard.summary.totalTasks} total tasks.
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Open</Text>
                <Text style={styles.metricValue}>{dashboard.summary.openTasks}</Text>
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
                <Text style={styles.metricLabel}>Lists</Text>
                <Text style={styles.metricValue}>{dashboard.summary.listCount}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Urgent queue</Text>
                <Link href="/(tabs)/add" asChild>
                  <Pressable>
                    <Text style={styles.sectionLink}>Add task</Text>
                  </Pressable>
                </Link>
              </View>
              {dashboard.urgentTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Nothing urgent right now.</Text>
                </View>
              ) : (
                dashboard.urgentTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    href={
                      {
                        pathname: "/task/edit/[id]",
                        params: { id: task.id }
                      } as never
                    }
                    listName={listNameById.get(task.listId)}
                    onToggle={(nextCompleted) => handleToggle(task.id, nextCompleted)}
                    task={task}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent completions</Text>
              {dashboard.recentCompletions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Complete a task and it will show up here.</Text>
                </View>
              ) : (
                dashboard.recentCompletions.map((task) => (
                  <TaskCard
                    key={task.id}
                    href={
                      {
                        pathname: "/task/edit/[id]",
                        params: { id: task.id }
                      } as never
                    }
                    listName={listNameById.get(task.listId)}
                    onToggle={(nextCompleted) => handleToggle(task.id, nextCompleted)}
                    task={task}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>List health</Text>
              <View style={styles.healthRow}>
                {lists.map((list) => (
                  <Link
                    href={
                      {
                        pathname: "/list/[id]",
                        params: { id: list.id }
                      } as never
                    }
                    key={list.id}
                    asChild
                  >
                    <Pressable style={styles.healthCard}>
                      <View style={[styles.healthSwatch, { backgroundColor: list.color }]} />
                      <Text style={styles.healthName}>{list.name}</Text>
                      <Text style={styles.healthMeta}>
                        {list.summary.completed}/{list.summary.total} done
                      </Text>
                      <Text style={styles.healthMeta}>
                        {formatCompletion(list.summary.completed, list.summary.total)}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          </>
        ) : null}
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
  heroCard: {
    backgroundColor: theme.colors.cardAccent,
    borderRadius: 28,
    gap: 10,
    padding: 22
  },
  heroEyebrow: {
    color: theme.colors.backgroundMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  heroValue: {
    color: theme.colors.background,
    fontFamily: theme.fonts.serif,
    fontSize: 44
  },
  heroBody: {
    color: theme.colors.background,
    fontSize: 15,
    lineHeight: 22
  },
  metricGrid: {
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
    fontSize: 30
  },
  section: {
    gap: 12
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 28
  },
  sectionLink: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "700"
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18
  },
  emptyText: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22
  },
  healthRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  healthCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: "47%",
    gap: 8,
    padding: 16
  },
  healthSwatch: {
    borderRadius: 999,
    height: 10,
    width: 40
  },
  healthName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  healthMeta: {
    color: theme.colors.subtleText,
    fontSize: 13
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 22
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
  },
  retryButton: {
    backgroundColor: theme.colors.text,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  retryButtonLabel: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: "700"
  }
});
