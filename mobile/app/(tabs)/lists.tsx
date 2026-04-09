import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator
} from "react-native-draggable-flatlist";

import { TaskCard } from "@/src/components/TaskCard";
import {
  createList,
  createTask,
  getLists,
  reorderLists,
  uploadTaskPhoto
} from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import {
  dueDateFromPreset,
  formatCompletion,
  formatDueDate,
  specificDateToIso,
  type DuePreset
} from "@/src/lib/format";
import { listColorPalette, theme } from "@/src/theme/tokens";
import type { TaskList, TaskUrgency } from "@/src/types/api";

const palette = listColorPalette;
const urgencyOptions: TaskUrgency[] = ["low", "medium", "high", "critical"];
const dueOptions: Array<{ key: DuePreset; label: string }> = [
  { key: "none", label: "No date" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "this-week", label: "3 days" },
  { key: "next-week", label: "Next week" },
  { key: "custom", label: "Specific date" }
];

export default function ListsScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const router = useRouter();
  const [lists, setLists] = useState<TaskList[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(palette[0]);
  const [addingTaskListId, setAddingTaskListId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskUrgency, setNewTaskUrgency] = useState<TaskUrgency>("medium");
  const [newTaskDuePreset, setNewTaskDuePreset] = useState<DuePreset>("today");
  const [newTaskSpecificDate, setNewTaskSpecificDate] = useState("");
  const [newTaskBeforePhoto, setNewTaskBeforePhoto] = useState<{
    uri: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingList, setSavingList] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [reordering, setReordering] = useState(false);
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

    setSavingList(true);
    setError(null);

    try {
      await createList(token, {
        name: newListName,
        color: selectedColor
      });

      setNewListName("");
      setShowCreateForm(false);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create list");
    } finally {
      setSavingList(false);
    }
  }

  function openTaskComposer(listId: string) {
    setAddingTaskListId((current) => (current === listId ? null : listId));
    setNewTaskTitle("");
    setNewTaskNotes("");
    setNewTaskUrgency("medium");
    setNewTaskDuePreset("today");
    setNewTaskSpecificDate("");
    setNewTaskBeforePhoto(null);
    setError(null);
  }

  async function handleCreateTask(listId: string) {
    if (!token || newTaskTitle.trim().length === 0) {
      return;
    }

    if (newTaskDuePreset === "custom" && !specificDateToIso(newTaskSpecificDate)) {
      setError("Enter a valid specific date in YYYY-MM-DD format.");
      return;
    }

    setSavingTask(true);
    setError(null);

    try {
      const created = await createTask(token, {
        listId,
        title: newTaskTitle,
        notes: newTaskNotes,
        urgency: newTaskUrgency,
        dueDate: dueDateFromPreset(newTaskDuePreset, newTaskSpecificDate)
      });

      if (newTaskBeforePhoto) {
        await uploadTaskPhoto(token, created.id, "before", newTaskBeforePhoto);
      }

      setAddingTaskListId(null);
      setNewTaskTitle("");
      setNewTaskNotes("");
      setNewTaskBeforePhoto(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create task");
    } finally {
      setSavingTask(false);
    }
  }

  async function pickTaskImage(source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(source === "camera" ? "Camera permission is required." : "Photo library permission is required.");
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            mediaTypes: ["images"],
            quality: 0.8
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            mediaTypes: ["images"],
            quality: 0.8
          });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setNewTaskBeforePhoto({
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      fileName: asset.fileName ?? `tasksnap-${Date.now()}.jpg`
    });
    setError(null);
  }

  function handleBeforePhotoPress() {
    Alert.alert("Before photo", "Choose how to add the optional before photo.", [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Camera",
        onPress: () => {
          void pickTaskImage("camera");
        }
      },
      {
        text: "Library",
        onPress: () => {
          void pickTaskImage("library");
        }
      },
      ...(newTaskBeforePhoto
        ? [
            {
              text: "Remove",
              style: "destructive" as const,
              onPress: () => {
                setNewTaskBeforePhoto(null);
              }
            }
          ]
        : [])
    ]);
  }

  async function handleReorder(nextLists: TaskList[]) {
    if (!token) {
      return;
    }

    const previousLists = lists;
    setLists(nextLists);
    setReordering(true);
    setError(null);

    try {
      const ordered = await reorderLists(
        token,
        nextLists.map((list) => list.id)
      );
      setLists(ordered);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === "Not found") {
        setError(null);
        return;
      }

      setLists(previousLists);
      setError(requestError instanceof Error ? requestError.message : "Could not reorder lists");
    } finally {
      setReordering(false);
    }
  }

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void load();
  }, [token, isFocused]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setShowCreateForm((current) => !current)}
          style={({ pressed }) => [
            styles.headerCreateButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={styles.headerCreateButtonLabel}>
            {showCreateForm ? "Close" : "Create list"}
          </Text>
        </Pressable>
      )
    });
  }, [navigation, showCreateForm]);

  const recentCompletions = lists
    .flatMap((list) =>
      list.tasks
        .filter((task) => task.completed)
        .map((task) => ({ ...task, listName: list.name }))
    )
    .sort(
      (left, right) =>
        new Date(right.completedAt ?? right.updatedAt).getTime() -
        new Date(left.completedAt ?? left.updatedAt).getTime()
    )
    .slice(0, 6);

  function renderListItem({ item, drag, isActive }: RenderItemParams<TaskList>) {
    const isAddingTask = addingTaskListId === item.id;

    return (
      <ScaleDecorator>
        <Pressable
          accessibilityHint={`Open ${item.name} list`}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/list/[id]",
              params: { id: item.id }
            })
          }
          style={({ pressed }) => [
            styles.listCard,
            isActive && styles.activeListCard,
            pressed && styles.buttonPressed
          ]}
        >
          <View style={styles.listHeader}>
            <View style={styles.headerLeft}>
              <Pressable
                accessibilityHint="Press and hold, then drag to reorder this list"
                accessibilityLabel={`Reorder ${item.name}`}
                delayLongPress={150}
                disabled={savingTask || reordering}
                hitSlop={8}
                onLongPress={drag}
                style={({ pressed }) => [
                  styles.dragHandle,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={styles.dragHandleIcon}>≡</Text>
              </Pressable>
              <View style={styles.listHeading}>
                <View style={[styles.listSwatch, { backgroundColor: item.color }]} />
                <Text style={styles.listName}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <Text style={styles.listMeta}>
                {formatCompletion(item.summary.completed, item.summary.total)}
              </Text>
              <Pressable
                onPress={() => openTaskComposer(item.id)}
                style={({ pressed }) => [
                  styles.inlineActionButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={styles.inlineActionLabel}>
                  {isAddingTask ? "Close" : "Add task"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.listBody}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(
                      8,
                      item.summary.total === 0
                        ? 8
                        : (item.summary.completed / item.summary.total) * 100
                    )}%`,
                    backgroundColor: item.color
                  }
                ]}
              />
            </View>

            <Text style={styles.summaryLine}>
              {item.summary.open} open · {item.summary.completed} done · {item.summary.overdue} overdue
            </Text>

            <View style={styles.previewColumn}>
              {item.tasks.slice(0, 2).map((task) => (
                <View key={task.id} style={styles.previewRow}>
                  <Text numberOfLines={1} style={styles.previewTitle}>
                    {task.title}
                  </Text>
                  <Text style={styles.previewMeta}>{formatDueDate(task.dueDate)}</Text>
                </View>
              ))}
              {item.tasks.length === 0 ? (
                <Text style={styles.previewEmpty}>This list is empty.</Text>
              ) : null}
            </View>
          </View>

          {isAddingTask ? (
            <View style={styles.taskComposer}>
              <TextInput
                onChangeText={setNewTaskTitle}
                placeholder="Task title"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                value={newTaskTitle}
              />
              <TextInput
                multiline
                onChangeText={setNewTaskNotes}
                placeholder="Notes"
                placeholderTextColor={theme.colors.mutedText}
                style={[styles.input, styles.notesInput]}
                textAlignVertical="top"
                value={newTaskNotes}
              />
              <View style={styles.compactSection}>
                <Text style={styles.compactLabel}>Urgency</Text>
                <View style={styles.chipRow}>
                  {urgencyOptions.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => setNewTaskUrgency(option)}
                      style={[
                        styles.filterChip,
                        newTaskUrgency === option && styles.filterChipActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          newTaskUrgency === option && styles.filterChipLabelActive
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.compactSection}>
                <Text style={styles.compactLabel}>Due date</Text>
                <View style={styles.chipRow}>
                  {dueOptions.map((option) => (
                    <Pressable
                      key={option.key}
                      onPress={() => setNewTaskDuePreset(option.key)}
                      style={[
                        styles.filterChip,
                        newTaskDuePreset === option.key && styles.filterChipActive
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          newTaskDuePreset === option.key && styles.filterChipLabelActive
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {newTaskDuePreset === "custom" ? (
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                    onChangeText={setNewTaskSpecificDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.mutedText}
                    style={styles.input}
                    value={newTaskSpecificDate}
                  />
                ) : null}
              </View>
              <View style={styles.compactSection}>
                <Text style={styles.compactLabel}>Before photo</Text>
                <Pressable
                  onPress={handleBeforePhotoPress}
                  style={({ pressed }) => [
                    styles.photoPickerBox,
                    pressed && styles.buttonPressed
                  ]}
                >
                  {newTaskBeforePhoto ? (
                    <>
                      <Image source={{ uri: newTaskBeforePhoto.uri }} style={styles.composerImagePreview} />
                      <Text style={styles.stateText}>Tap to replace or remove photo.</Text>
                    </>
                  ) : (
                    <View style={styles.imageEmptyState}>
                      <Text style={styles.stateText}>Before photo optional. Tap to add one.</Text>
                    </View>
                  )}
                </Pressable>
              </View>
              <Pressable
                disabled={savingTask || newTaskTitle.trim().length === 0}
                onPress={() => handleCreateTask(item.id)}
                style={[
                  styles.primaryButton,
                  (savingTask || newTaskTitle.trim().length === 0) && styles.buttonDisabled
                ]}
              >
                <Text style={styles.primaryButtonLabel}>
                  {savingTask ? "Saving..." : "Save task"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </ScaleDecorator>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <DraggableFlatList
        activationDistance={12}
        contentContainerStyle={styles.content}
        data={lists}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {showCreateForm ? (
              <View style={styles.createCard}>
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
                  disabled={savingList || newListName.trim().length === 0}
                  onPress={handleCreateList}
                  style={[
                    styles.primaryButton,
                    (savingList || newListName.trim().length === 0) && styles.buttonDisabled
                  ]}
                >
                  <Text style={styles.primaryButtonLabel}>
                    {savingList ? "Creating..." : "Save list"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={styles.stateText}>Loading your lists...</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Could not update lists</Text>
                <Text style={styles.stateText}>{error}</Text>
              </View>
            ) : null}

            {!loading && !error && lists.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No lists yet</Text>
                <Text style={styles.stateText}>Tap create list to add your first one.</Text>
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          !loading && !error ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent completions</Text>
              {recentCompletions.length === 0 ? (
                <View style={styles.stateCard}>
                  <Text style={styles.stateText}>Complete a task and it will show up here.</Text>
                </View>
              ) : (
                recentCompletions.map((task) => (
                  <TaskCard
                    key={task.id}
                    href={
                      {
                        pathname: "/task/edit/[id]",
                        params: { id: task.id }
                      } as never
                    }
                    listName={task.listName}
                    onTaskUpdated={() => {
                      void load();
                    }}
                    task={task}
                  />
                ))
              )}
            </View>
          ) : null
        }
        onDragEnd={({ data }) => {
          void handleReorder(data);
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        renderItem={renderListItem}
      />
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
    paddingTop: 6
  },
  headerCreateButton: {
    backgroundColor: theme.colors.text,
    borderRadius: 999,
    marginRight: 6,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  headerCreateButtonLabel: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bold,
    fontSize: 12,
  },
  createCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
    padding: 18
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 15
  },
  notesInput: {
    minHeight: 78
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
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonPressed: {
    opacity: 0.86
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
  },
  section: {
    gap: 12,
    marginTop: 6
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 24
  },
  listCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 9,
    marginBottom: 12,
    padding: 14
  },
  activeListCard: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18
  },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 10
  },
  listHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  listSwatch: {
    borderRadius: 999,
    height: 14,
    width: 14
  },
  listName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 20
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 6
  },
  listMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    letterSpacing: 0.2
  },
  dragHandle: {
    alignItems: "center",
    justifyContent: "center",
    height: 22,
    width: 22
  },
  dragHandleIcon: {
    color: theme.colors.mutedText,
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    lineHeight: 17
  },
  inlineActionButton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  inlineActionLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 10,
  },
  listBody: {
    gap: 8
  },
  progressTrack: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 999,
    height: 7,
    overflow: "hidden"
  },
  progressFill: {
    borderRadius: 999,
    height: 7
  },
  summaryLine: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 11,
  },
  previewColumn: {
    gap: 6
  },
  previewRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  previewTitle: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    marginRight: 12
  },
  previewMeta: {
    color: theme.colors.mutedText,
    fontFamily: theme.fonts.regular,
    fontSize: 10
  },
  previewEmpty: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 14
  },
  taskComposer: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 14
  },
  compactSection: {
    gap: 8
  },
  compactLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
  },
  composerImagePreview: {
    borderRadius: 18,
    height: 160,
    width: "100%"
  },
  photoPickerBox: {
    gap: 10
  },
  imageEmptyState: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 88,
    padding: 12
  },
  chipRow: {
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
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    textTransform: "capitalize"
  },
  filterChipLabelActive: {
    color: theme.colors.background
  }
});
