import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { createList, getLists } from "@/src/lib/api";
import { formatCompletion, formatDueDate } from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { TaskList } from "@/src/types/api";

const palette = ["#D5E6C5", "#F1D7C7", "#CBD6F2", "#F4E3B1", "#D8C8E8"];

export default function ListsScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [lists, setLists] = useState<TaskList[]>([]);
  const [newListName, setNewListName] = useState("");
  const [selectedColor, setSelectedColor] = useState(palette[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
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
      const response = await getLists(token);
      setLists(response);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load lists");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCreateList() {
    if (!token || newListName.trim().length === 0) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createList(token, {
        name: newListName,
        color: selectedColor
      });

      setNewListName("");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create list");
    } finally {
      setSaving(false);
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
          <Text style={styles.kicker}>Lists</Text>
          <Text style={styles.title}>Organize work by context</Text>
          <Text style={styles.subtitle}>
            Split tasks into separate lists, then drill into each one by urgency and due date.
          </Text>
        </View>

        <View style={styles.createCard}>
          <Text style={styles.createTitle}>Create a new list</Text>
          <TextInput
            onChangeText={setNewListName}
            placeholder="List name"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.input}
            value={newListName}
          />
          <View style={styles.colorRow}>
            {palette.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorChip,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorChipSelected
                ]}
              />
            ))}
          </View>
          <Pressable
            disabled={saving || newListName.trim().length === 0}
            onPress={handleCreateList}
            style={[
              styles.primaryButton,
              (saving || newListName.trim().length === 0) && styles.buttonDisabled
            ]}
          >
            <Text style={styles.primaryButtonLabel}>
              {saving ? "Creating..." : "Create list"}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.stateText}>Loading your lists...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load lists</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && lists.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No lists yet</Text>
            <Text style={styles.stateText}>Create your first list above and then add tasks to it.</Text>
          </View>
        ) : null}

        {!loading && !error
          ? lists.map((list) => (
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
                <Pressable style={styles.listCard}>
                  <View style={styles.listHeader}>
                    <View style={styles.listHeading}>
                      <View style={[styles.listSwatch, { backgroundColor: list.color }]} />
                      <Text style={styles.listName}>{list.name}</Text>
                    </View>
                    <Text style={styles.listMeta}>
                      {formatCompletion(list.summary.completed, list.summary.total)}
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max(
                            8,
                            list.summary.total === 0
                              ? 8
                              : (list.summary.completed / list.summary.total) * 100
                          )}%`,
                          backgroundColor: list.color
                        }
                      ]}
                    />
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{list.summary.open} open</Text>
                    <Text style={styles.metaText}>{list.summary.completed} completed</Text>
                    <Text style={styles.metaText}>{list.summary.overdue} overdue</Text>
                  </View>

                  <View style={styles.previewColumn}>
                    {list.tasks.slice(0, 3).map((task) => (
                      <View key={task.id} style={styles.previewRow}>
                        <Text numberOfLines={1} style={styles.previewTitle}>
                          {task.title}
                        </Text>
                        <Text style={styles.previewMeta}>{formatDueDate(task.dueDate)}</Text>
                      </View>
                    ))}
                    {list.tasks.length === 0 ? (
                      <Text style={styles.previewEmpty}>This list is empty.</Text>
                    ) : null}
                  </View>
                </Pressable>
              </Link>
            ))
          : null}
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
  createCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  createTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700"
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 15
  },
  colorRow: {
    flexDirection: "row",
    gap: 10
  },
  colorChip: {
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 28,
    width: 28
  },
  colorChipSelected: {
    borderColor: theme.colors.text,
    transform: [{ scale: 1.08 }]
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    paddingVertical: 15
  },
  primaryButtonLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  listCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  listHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  listSwatch: {
    borderRadius: 999,
    height: 16,
    width: 16
  },
  listName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 28
  },
  listMeta: {
    color: theme.colors.subtleText,
    fontSize: 14,
    fontWeight: "700"
  },
  progressTrack: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    borderRadius: 999,
    height: 10
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metaText: {
    color: theme.colors.subtleText,
    fontSize: 13,
    fontWeight: "600"
  },
  previewColumn: {
    gap: 10
  },
  previewRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  previewTitle: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    marginRight: 12
  },
  previewMeta: {
    color: theme.colors.mutedText,
    fontSize: 12
  },
  previewEmpty: {
    color: theme.colors.subtleText,
    fontSize: 14
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
