import * as AuthSession from "expo-auth-session";

// The OAuth redirect URI used for Discord. In a dev/standalone build this resolves
// to `app://oauth`. Register this exact value in the Discord developer portal.
// (Google uses the native iOS client's own reversed-bundle-id redirect, handled by
// expo-auth-session/providers/google.)
export const redirectUri = AuthSession.makeRedirectUri({ scheme: "app", path: "oauth" });

// Dev helper: prints the exact string to register as Discord's redirect URI.
if (__DEV__) console.log("[oauth] Discord redirect URI to register:", redirectUri);

// Discord works with a custom-scheme redirect, so the app gets a PKCE code and the
// backend exchanges it (Discord client secret stays on the backend).
export const discord = {
  discovery: {
    authorizationEndpoint: "https://discord.com/oauth2/authorize",
    tokenEndpoint: "https://discord.com/api/oauth2/token",
  } as AuthSession.DiscoveryDocument,
  config: {
    clientId: process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID ?? "",
    scopes: ["identify", "email"],
    redirectUri,
  } as AuthSession.AuthRequestConfig,
};
