import { useEffect, useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useAuth } from "@/lib/auth-context";
import { discord, redirectUri } from "@/lib/oauth";
import { errorMessage } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { signInWithEmail, completeGoogle, completeDiscord } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Google: native iOS client → returns an ID token (verified by the backend).
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  // Discord: PKCE auth code (exchanged by the backend).
  const [discordRequest, discordResponse, promptDiscord] = AuthSession.useAuthRequest(
    discord.config,
    discord.discovery,
  );

  useEffect(() => {
    if (googleResponse?.type === "success" && googleResponse.params.id_token) {
      setError(null);
      setSubmitting(true);
      completeGoogle(googleResponse.params.id_token)
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setSubmitting(false));
    } else if (googleResponse?.type === "error") {
      setError("Google sign-in was cancelled or failed");
    }
  }, [googleResponse]);

  useEffect(() => {
    if (discordResponse?.type === "success" && discordRequest?.codeVerifier) {
      setError(null);
      setSubmitting(true);
      completeDiscord({
        code: discordResponse.params.code,
        codeVerifier: discordRequest.codeVerifier,
        redirectUri,
      })
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setSubmitting(false));
    } else if (discordResponse?.type === "error") {
      setError("Discord sign-in was cancelled or failed");
    }
  }, [discordResponse]);

  async function onSubmit() {
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    if (!password) {
      setError("Enter your password");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed, submitting && styles.disabled]}
        onPress={onSubmit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
      </Pressable>

      <Text style={styles.divider}>or</Text>

      <Pressable
        style={({ pressed }) => [styles.oauth, styles.google, pressed && styles.pressed]}
        onPress={() => promptGoogle()}
        disabled={!googleRequest || submitting}
      >
        <Text style={styles.googleText}>Continue with Google</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.oauth, styles.discord, pressed && styles.pressed]}
        onPress={() => promptDiscord()}
        disabled={!discordRequest || submitting}
      >
        <Text style={styles.oauthText}>Continue with Discord</Text>
      </Pressable>

      <Link href="/signup" style={styles.link}>
        Don&apos;t have an account? Sign up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  error: { color: "#000" },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 0,
    alignItems: "center",
    marginTop: 4,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  divider: { textAlign: "center", color: "#999", marginVertical: 4 },
  oauth: { paddingVertical: 16, borderRadius: 0, alignItems: "center" },
  google: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc" },
  googleText: { color: "#1f1f1f", fontSize: 16, fontWeight: "600" },
  discord: { backgroundColor: "#000" },
  oauthText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { textAlign: "center", color: "#000", marginTop: 16, fontSize: 15 },
});
