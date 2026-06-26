import { useState } from "react";
import { Text, View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useAuth } from "@/lib/auth-context";

// The single protected screen: shows the signed-in user and a logout button.
export default function Home() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  return (
    <View style={styles.container}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <Text style={styles.name}>{user.name ?? "Signed in"}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          await signOut();
        }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log out</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 8 },
  avatarFallback: { backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 40, fontWeight: "600" },
  name: { fontSize: 22, fontWeight: "600" },
  email: { fontSize: 15, color: "#666", marginBottom: 24 },
  button: {
    backgroundColor: "#000",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 0,
    minWidth: 160,
    alignItems: "center",
  },
  pressed: { opacity: 0.8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
