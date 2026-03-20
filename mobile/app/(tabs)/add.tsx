import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { createSpot, uploadPhoto } from "@/src/lib/api";
import { theme } from "@/src/theme/tokens";
import type { SpotPhoto } from "@/src/types/api";

type PendingPhoto = SpotPhoto & {
  localUri: string;
};

export default function AddSpotScreen() {
  const isSimulator = !Constants.isDevice;
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrentLocation() {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationError("Location access is required to save a spot.");
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude
        });
      } catch {
        setLocationError("Could not determine your current location.");
      }
    }

    loadCurrentLocation();
  }, []);

  async function uploadAssets(
    assets: ImagePicker.ImagePickerAsset[] | null | undefined
  ) {
    if (!token || !assets || assets.length === 0) {
      return;
    }

    setPhotoBusy(true);
    setError(null);

    try {
      const uploadedPhotos = await Promise.all(
        assets.map(async (asset) => {
          const extension = asset.fileName?.split(".").pop() ?? "jpg";
          const uploaded = await uploadPhoto(token, {
            uri: asset.uri,
            name: asset.fileName ?? `spot-${Date.now()}.${extension}`,
            type: asset.mimeType ?? "image/jpeg"
          });

          return {
            ...uploaded,
            localUri: asset.uri
          } satisfies PendingPhoto;
        })
      );

      setPhotos((current) => [...current, ...uploadedPhotos]);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not upload image"
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleOpenCamera() {
    if (isSimulator) {
      setError("Take photo is not available in iOS Simulator. Use Choose photos instead.");
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setError("Camera access was denied. You can still choose from the gallery.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        mediaTypes: ["images"],
        quality: 0.8
      });

      if (!result.canceled) {
        await uploadAssets(result.assets);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Camera is unavailable.";

      if (message.toLowerCase().includes("camera not available on simulator")) {
        setError("Camera is not available in iOS Simulator. Use Choose photos instead.");
        return;
      }

      setError(message);
    }
  }

  async function handleOpenLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Photo library access is required to add pictures.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      orderedSelection: true,
      quality: 0.8,
      selectionLimit: 6
    });

    if (!result.canceled) {
      await uploadAssets(result.assets);
    }
  }

  async function handleSave() {
    if (!token) {
      return;
    }

    if (!location) {
      setError(locationError ?? "Current location is still loading.");
      return;
    }

    if (photos.length === 0) {
      setError("Add at least one photo before saving a spot.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const spot = await createSpot(token, {
        title,
        note,
        latitude: location.latitude,
        longitude: location.longitude,
        photos: photos.map(({ localUri, ...photo }) => photo)
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
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.kicker}>New Spot</Text>
            <Text style={styles.title}>Capture the moment while you are there.</Text>
          </View>

          <View style={styles.uploadRow}>
            <Pressable
              disabled={isSimulator}
              onPress={handleOpenCamera}
              style={[styles.uploadCard, isSimulator && styles.uploadCardDisabled]}
            >
              <Text style={styles.uploadCardTitle}>
                {isSimulator ? "Take photo unavailable" : "Take photo"}
              </Text>
              <Text style={styles.uploadCardText}>
                {isSimulator
                  ? "Camera does not exist in Simulator"
                  : "Open camera and upload"}
              </Text>
            </Pressable>
            <Pressable onPress={handleOpenLibrary} style={styles.uploadCard}>
              <Text style={styles.uploadCardTitle}>Choose photos</Text>
              <Text style={styles.uploadCardText}>From gallery, immediately uploaded</Text>
            </Pressable>
          </View>

          <View style={styles.photoStrip}>
            {photos.length > 0 ? (
              photos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.localUri }}
                  style={styles.photoPreview}
                />
              ))
            ) : (
              <>
                <View style={[styles.photoPreview, { backgroundColor: "#C8D5C2" }]} />
                <View style={[styles.photoPreview, { backgroundColor: "#D7C9B8" }]} />
                <View style={[styles.photoPreview, { backgroundColor: "#A4B9B0" }]} />
              </>
            )}
          </View>

          {photoBusy ? (
            <View style={styles.inlineState}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={styles.inlineStateText}>Uploading images...</Text>
            </View>
          ) : null}

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
            <Text style={styles.locationValue}>
              {location
                ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : "Locating..."}
            </Text>
            <Text style={styles.locationHint}>
              Current GPS only. If permission is denied, saving is blocked until
              location access is granted.
            </Text>
          </View>

          {locationError ? <Text style={styles.error}>{locationError}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={saving || photoBusy}
            onPress={handleSave}
            style={[styles.saveButton, (saving || photoBusy) && styles.buttonDisabled]}
          >
            {saving ? <ActivityIndicator color={theme.colors.background} /> : null}
            <Text style={styles.saveButtonLabel}>
              {saving ? "Saving..." : "Save Spot"}
            </Text>
          </Pressable>
        </View>
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
    flex: 1
  },
  content: {
    paddingBottom: 24,
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
  uploadCardDisabled: {
    opacity: 0.55
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
    flexWrap: "wrap",
    gap: 10
  },
  photoPreview: {
    borderRadius: 20,
    height: 120,
    width: 100
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
  inlineState: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  inlineStateText: {
    color: theme.colors.subtleText,
    fontSize: 14
  },
  footer: {
    backgroundColor: theme.colors.background,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 12
  },
  buttonDisabled: {
    opacity: 0.7
  }
});
