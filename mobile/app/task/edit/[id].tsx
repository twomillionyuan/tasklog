import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useNavigation, router } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { deleteTask, deleteTaskPhoto, getLists, getTask, updateTask, uploadTaskPhoto } from "@/src/lib/api";
import {
  type DuePreset,
  dueDateFromPreset,
  formatDateTime,
  presetFromDueDate,
  specificDateInputValue,
  specificDateToIso
} from "@/src/lib/format";
import { theme } from "@/src/theme/tokens";
import type { Task, TaskList, TaskUrgency } from "@/src/types/api";

const urgencyOptions: TaskUrgency[] = ["low", "medium", "high", "critical"];
const dueOptions: Array<{ key: DuePreset; label: string }> = [
  { key: "none", label: "No date" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "this-week", label: "3 days" },
  { key: "next-week", label: "Next week" },
  { key: "custom", label: "Specific date" }
];

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { token } = useAuth();
  const [lists, setLists] = useState<TaskList[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedListId, setSelectedListId] = useState("");
  const [urgency, setUrgency] = useState<TaskUrgency>("medium");
  const [duePreset, setDuePreset] = useState<DuePreset>("none");
  const [customDueDate, setCustomDueDate] = useState("");
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token || !id) {
      return;
    }

    setLoading(true);

    try {
      const [nextTask, nextLists] = await Promise.all([getTask(token, id), getLists(token)]);

      setTask(nextTask);
      setLists(nextLists);
      setTitle(nextTask.title);
      setNotes(nextTask.notes);
      setSelectedListId(nextTask.listId);
      setUrgency(nextTask.urgency);
      setCompleted(nextTask.completed);
      setDuePreset(presetFromDueDate(nextTask.dueDate));
      setCustomDueDate(specificDateInputValue(nextTask.dueDate));
      navigation.setOptions({
        title: nextTask.title
      });
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load task");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!token || !id || title.trim().length === 0) {
      return;
    }

    if (duePreset === "custom" && !specificDateToIso(customDueDate)) {
      setError("Enter a valid specific date in YYYY-MM-DD format.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateTask(token, id, {
        title,
        notes,
        urgency,
        completed,
        listId: selectedListId,
        dueDate: dueDateFromPreset(duePreset, customDueDate)
      });

      router.replace({
        pathname: "/list/[id]",
        params: { id: updated.listId }
      } as never);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!token || !id) {
      return;
    }

    setSaving(true);

    try {
      await deleteTask(token, id);
      router.replace("/(tabs)/lists" as never);
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto(kind: "before" | "after", source: "camera" | "library") {
    if (!token || !id) {
      return;
    }

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

    setUploadingAttachment(true);
    setError(null);

    try {
      const asset = result.assets[0];
      const updated = await uploadTaskPhoto(token, id, kind, {
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `task-${id}.jpg`
      });

      setTask(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not upload image");
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handleRemovePhoto(kind: "before" | "after") {
    if (!token || !id) {
      return;
    }

    setUploadingAttachment(true);
    setError(null);

    try {
      const updated = await deleteTaskPhoto(token, id, kind);
      setTask(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not remove image");
    } finally {
      setUploadingAttachment(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token, id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.stateText}>Loading task...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Could not load task</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && task ? (
          <>
            <View style={styles.formCard}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                onChangeText={setTitle}
                placeholder="Task title"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                value={title}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                multiline
                onChangeText={setNotes}
                placeholder="Notes"
                placeholderTextColor={theme.colors.mutedText}
                style={[styles.input, styles.notesInput]}
                textAlignVertical="top"
                value={notes}
              />

              <Text style={styles.label}>List</Text>
              <View style={styles.chipRow}>
                {lists.map((list) => (
                  <Pressable
                    key={list.id}
                    onPress={() => setSelectedListId(list.id)}
                    style={[
                      styles.listChip,
                      { backgroundColor: list.color },
                      selectedListId === list.id && styles.listChipSelected
                    ]}
                  >
                    <Text style={styles.listChipLabel}>{list.name}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Urgency</Text>
              <View style={styles.chipRow}>
                {urgencyOptions.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setUrgency(option)}
                    style={[
                      styles.filterChip,
                      urgency === option && styles.filterChipActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        urgency === option && styles.filterChipLabelActive
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Due date</Text>
              <View style={styles.chipRow}>
                {dueOptions.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() => setDuePreset(option.key)}
                    style={[
                      styles.filterChip,
                      duePreset === option.key && styles.filterChipActive
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        duePreset === option.key && styles.filterChipLabelActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {duePreset === "custom" ? (
                <TextInput
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                  onChangeText={setCustomDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.mutedText}
                  style={styles.input}
                  value={customDueDate}
                />
              ) : null}

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.label}>Completed</Text>
                  <Text style={styles.helperText}>
                    {task.completedAt ? `Finished ${formatDateTime(task.completedAt)}` : "Still open"}
                  </Text>
                </View>
                <Switch onValueChange={setCompleted} value={completed} />
              </View>

              <View style={styles.attachmentSection}>
                <Text style={styles.label}>Before photo</Text>
                {task.beforePhotoUrl ? (
                  <Image source={{ uri: task.beforePhotoUrl }} style={styles.attachmentPreview} />
                ) : (
                  <View style={styles.attachmentEmpty}>
                    <Text style={styles.helperText}>No before photo was added when this task was created.</Text>
                  </View>
                )}
                <Text style={styles.helperText}>Before photos can only be added when creating the task.</Text>
              </View>

              <View style={styles.attachmentSection}>
                <Text style={styles.label}>After photo</Text>
                {task.afterPhotoUrl ? (
                  <Image source={{ uri: task.afterPhotoUrl }} style={styles.attachmentPreview} />
                ) : (
                  <View style={styles.attachmentEmpty}>
                    <Text style={styles.helperText}>Add the finished-result photo before completing the task.</Text>
                  </View>
                )}
                <View style={styles.attachmentActions}>
                  <Pressable
                    disabled={uploadingAttachment}
                    onPress={() => handlePickPhoto("after", "camera")}
                    style={[styles.filterChip, uploadingAttachment && styles.buttonDisabled]}
                  >
                    <Text style={styles.filterChipLabel}>Camera</Text>
                  </Pressable>
                  <Pressable
                    disabled={uploadingAttachment}
                    onPress={() => handlePickPhoto("after", "library")}
                    style={[styles.filterChip, uploadingAttachment && styles.buttonDisabled]}
                  >
                    <Text style={styles.filterChipLabel}>Library</Text>
                  </Pressable>
                  {task.afterPhotoUrl ? (
                    <Pressable
                      disabled={uploadingAttachment}
                      onPress={() => handleRemovePhoto("after")}
                      style={[styles.filterChip, uploadingAttachment && styles.buttonDisabled]}
                    >
                      <Text style={styles.filterChipLabel}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              disabled={saving || title.trim().length === 0}
              onPress={handleSave}
              style={[styles.primaryButton, (saving || title.trim().length === 0) && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonLabel}>{saving ? "Saving..." : "Save changes"}</Text>
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={handleDelete}
              style={[styles.deleteButton, saving && styles.buttonDisabled]}
            >
              <Text style={styles.deleteButtonLabel}>Delete task</Text>
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
  formCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  label: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    marginTop: 4
  },
  helperText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18
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
    minHeight: 100
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  listChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  listChipSelected: {
    borderColor: theme.colors.text,
    borderWidth: 2
  },
  listChipLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
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
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8
  },
  attachmentSection: {
    gap: 10,
    marginTop: 4
  },
  attachmentPreview: {
    borderRadius: 20,
    height: 220,
    width: "100%"
  },
  attachmentEmpty: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 20,
    justifyContent: "center",
    minHeight: 120,
    padding: 16
  },
  attachmentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    paddingVertical: 16
  },
  primaryButtonLabel: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: theme.colors.danger,
    borderRadius: 18,
    paddingVertical: 16
  },
  deleteButtonLabel: {
    color: theme.colors.background,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6
  },
  error: {
    color: theme.colors.danger,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20
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
