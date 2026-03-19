import { Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useEffect, useState } from "react";

import { useAuth } from "@/src/context/AuthContext";
import { getSpot, updateSpot } from "@/src/lib/api";
import { theme } from "@/src/theme/tokens";

export default function EditSpotScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token || !id) {
        return;
      }

      setLoading(true);

      try {
        const spot = await getSpot(token, id);
        setTitle(spot.title);
        setNote(spot.note);
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Could not load spot"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, token]);

  async function handleSave() {
    if (!token || !id) {
      return;
    }

    setSaving(true);

    try {
      await updateSpot(token, id, {
        title,
        note
      });
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not save changes"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Spot" }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Update this memory</Text>
            <Text style={styles.subtitle}>
              Edit title and note. Uploaded photos stay attached to the spot.
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.subtitle}>Loading spot...</Text>
            </View>
          ) : null}

          {!loading ? (
            <>
          <TextInput
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.input}
            value={title}
          />
          <TextInput
            multiline
            onChangeText={setNote}
            placeholder="Note"
            placeholderTextColor={theme.colors.mutedText}
            style={[styles.input, styles.noteInput]}
            value={note}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={[styles.button, saving && styles.buttonDisabled]}
          >
            <Text style={styles.buttonLabel}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
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
    gap: 16
  },
  header: {
    gap: 8,
    marginTop: 8
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 30
  },
  subtitle: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 15
  },
  noteInput: {
    minHeight: 140,
    paddingTop: 16,
    textAlignVertical: "top"
  },
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    paddingVertical: 16
  },
  buttonLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    gap: 10,
    padding: 24
  },
  error: {
    color: "#A04B41",
    fontSize: 14,
    lineHeight: 20
  },
  buttonDisabled: {
    opacity: 0.7
  }
});
