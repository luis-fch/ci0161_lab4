import * as SecureStore from "expo-secure-store";

// Persisted session token. SecureStore uses the iOS Keychain / Android Keystore.
// Note: SecureStore is native-only; this app targets iOS/Android.
const TOKEN_KEY = "session_token";

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function deleteToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
