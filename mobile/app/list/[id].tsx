import { useEffect, useState } from "react";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskCard } from "@/src/components/TaskCard";
import { useAuth } from "@/src/context/AuthContext";
import { deleteList, getList, updateTask } from "@/src/lib/api";
import { formatCompletion } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { TaskList } from "@/src/types/api";

type FilterState = "all" | "open" | "completed";

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { token } = useAuth();
  const [list, setList] = useState<TaskList | null>(null);
  const [filter, setFilter] = useState<FilterState>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(nextRefreshing = false) {
    if (!token || !id) {
      return;
    }

    if (nextRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getList(token, id);
      setList(response);
      navigation.setOptions({
        title: response.name
      });
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load list");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleToggle(taskId: string, nextCompleted: boolean) {
    if (!token) {
      return;
    }

    setBusy(true);

    try {
      await updateTask(token, taskId, {
        completed: nextCompleted
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteList() {
    if (!token || !id) {
      return;
    }

    setBusy(true);

    try {
      await deleteList(token, id);
      router.replace("/(tabs)/lists" as never);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token, id]);

  const filteredTasks =
    filter === "all"
      ? list?.tasks ?? []
      : (list?.tasks ?? []).filter((task) => (filter === "open" ? !task.completed : task.completed));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.stateText}>Loading list...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load list</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && list ? (
          <>
            <View style={[styles.heroCard, { borderLeftColor: list.color }]}>
              <Text style={styles.heroTitle}>{list.name}</Text>
              <Text style={styles.heroBody}>
                {list.summary.open} open, {list.summary.completed} completed, {list.summary.overdue} overdue.
              </Text>
              <Text style={styles.heroBody}>
                Completion: {formatCompletion(list.summary.completed, list.summary.total)}
              </Text>
            </View>

            <View style={styles.filterRow}>
              {(["all", "open", "completed"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setFilter(option)}
                  style={[styles.filterChip, filter === option && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipLabel,
                      filter === option && styles.filterChipLabelActive
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.taskColumn}>
              {filteredTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No tasks in this filter.</Text>
                </View>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    href={
                      {
                        pathname: "/task/edit/[id]",
                        params: { id: task.id }
                      } as never
                    }
                    onToggle={(nextCompleted) => handleToggle(task.id, nextCompleted)}
                    task={task}
                  />
                ))
              )}
            </View>

            <Pressable
              disabled={busy}
              onPress={handleDeleteList}
              style={[styles.archiveButton, busy && styles.buttonDisabled]}
            >
              <Text style={styles.archiveButtonLabel}>
                {busy ? "Working..." : "Archive list"}
              </Text>
            </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 12
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderLeftWidth: 8,
    borderRadius: 28,
    borderWidth: 1,
    gap: 8,
    padding: 20
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 34
  },
  heroBody: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  filterChipActive: {
    backgroundColor: theme.colors.cardAccent
  },
  filterChipLabel: {
    color: theme.colors.subtleText,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  filterChipLabelActive: {
    color: theme.colors.background
  },
  taskColumn: {
    gap: 12
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
  archiveButton: {
    alignItems: "center",
    backgroundColor: "#A04B41",
    borderRadius: 18,
    paddingVertical: 15
  },
  archiveButtonLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
  },
  buttonDisabled: {
    opacity: 0.6
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
