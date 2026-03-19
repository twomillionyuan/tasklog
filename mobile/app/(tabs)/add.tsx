import { router } from "expo-router";
import { useState } from "react";
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

import { useAuth } from "@/src/context/AuthContext";
import { createSpot } from "@/src/lib/api";
import { theme } from "@/src/theme/tokens";

export default function AddSpotScreen() {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!token) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const spot = await createSpot(token, {
        title,
        note,
        latitude: 59.3293,
        longitude: 18.0686,
        photos: []
      });

      router.push(`/spot/${spot.id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save spot"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>New Spot</Text>
          <Text style={styles.title}>Capture the moment while you are there.</Text>
        </View>

        <View style={styles.uploadRow}>
          <Pressable style={styles.uploadCard}>
            <Text style={styles.uploadCardTitle}>Take photo</Text>
            <Text style={styles.uploadCardText}>Open camera</Text>
          </Pressable>
          <Pressable style={styles.uploadCard}>
            <Text style={styles.uploadCardTitle}>Choose photos</Text>
            <Text style={styles.uploadCardText}>From gallery</Text>
          </Pressable>
        </View>

        <View style={styles.photoStrip}>
          <View style={[styles.photoPreview, { backgroundColor: "#C8D5C2" }]} />
          <View style={[styles.photoPreview, { backgroundColor: "#D7C9B8" }]} />
          <View style={[styles.photoPreview, { backgroundColor: "#A4B9B0" }]} />
        </View>

        <View style={styles.form}>
          <TextInput
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.input}
            value={title}
          />
          <TextInput
            multiline
            numberOfLines={5}
            onChangeText={setNote}
            placeholder="Short note"
            placeholderTextColor={theme.colors.mutedText}
            style={[styles.input, styles.noteInput]}
            value={note}
          />
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Current location</Text>
          <Text style={styles.locationValue}>59.3293, 18.0686</Text>
          <Text style={styles.locationHint}>
            In MVP this will use current GPS only, with a permission prompt if
            access is denied.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={saving}
          onPress={handleSave}
          style={[styles.saveButton, saving && styles.buttonDisabled]}
        >
          {saving ? <ActivityIndicator color={theme.colors.background} /> : null}
          <Text style={styles.saveButtonLabel}>
            {saving ? "Saving..." : "Save Spot"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
    gap: 18
  },
  header: {
    marginTop: 8,
    gap: 8
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
    fontSize: 32,
    lineHeight: 40
  },
  uploadRow: {
    flexDirection: "row",
    gap: 12
  },
  uploadCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    flex: 1,
    gap: 6,
    minHeight: 112,
    padding: 18
  },
  uploadCardTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  uploadCardText: {
    color: theme.colors.subtleText,
    fontSize: 14
  },
  photoStrip: {
    flexDirection: "row",
    gap: 10
  },
  photoPreview: {
    borderRadius: 20,
    flex: 1,
    height: 120
  },
  form: {
    gap: 12
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
    minHeight: 130,
    paddingTop: 16,
    textAlignVertical: "top"
  },
  locationCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 24,
    gap: 6,
    padding: 18
  },
  locationLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase"
  },
  locationValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700"
  },
  locationHint: {
    color: theme.colors.subtleText,
    fontSize: 14,
    lineHeight: 20
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    gap: 8,
    paddingVertical: 16
  },
  saveButtonLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
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
