import { Link, Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";

import { useAuth } from "@/src/context/AuthContext";
import { theme } from "@/src/theme/tokens";

export default function RegisterScreen() {
  const { isAuthenticated, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/feed" />;
  }

  async function handleSubmit() {
    if (password !== confirmPassword) {
      setError("Passwords must match");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await signUp(email, password);
      router.replace("/(tabs)/feed");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Could not create account"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.kicker}>Create Account</Text>
        <Text style={styles.title}>Start your own map of memories.</Text>
        <Text style={styles.subtitle}>
          Registration will connect to the OSC-hosted auth API once the backend
          flow is built.
        </Text>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={theme.colors.mutedText}
            onChangeText={setEmail}
            style={styles.input}
            value={email}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.colors.mutedText}
            secureTextEntry
            onChangeText={setPassword}
            style={styles.input}
            value={password}
          />
          <TextInput
            placeholder="Confirm password"
            placeholderTextColor={theme.colors.mutedText}
            secureTextEntry
            onChangeText={setConfirmPassword}
            style={styles.input}
            value={confirmPassword}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={submitting}
          onPress={handleSubmit}
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonLabel}>
            {submitting ? "Creating Account..." : "Create Account"}
          </Text>
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonLabel}>Already have an account?</Text>
          </Pressable>
        </Link>
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
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.serif,
    fontSize: 34,
    lineHeight: 42
  },
  subtitle: {
    color: theme.colors.subtleText,
    fontSize: 15,
    lineHeight: 22
  },
  form: {
    gap: 12,
    marginTop: 8
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
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.text,
    borderRadius: 18,
    marginTop: 8,
    paddingVertical: 16
  },
  primaryButtonLabel: {
    color: theme.colors.background,
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 10
  },
  secondaryButtonLabel: {
    color: theme.colors.subtleText,
    fontSize: 14,
    fontWeight: "600"
  },
  error: {
    color: "#A04B41",
    fontSize: 14,
    lineHeight: 20
  },
  buttonDisabled: {
    opacity: 0.6
  }
});
