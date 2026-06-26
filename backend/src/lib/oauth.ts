import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./env";

export type Provider = "google" | "discord";

export interface OAuthProfile {
  provider: Provider;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
}

// Thrown for any provider-side failure; routes map this to a 401.
export class OAuthError extends Error {}

function required(name: string, value: string | undefined): string {
  if (!value) throw new OAuthError(`${name} is not configured on the server`);
  return value;
}

// --- Google (OpenID Connect) ---
// The app signs in with the native iOS client (expo-auth-session) and obtains a
// Google ID token. We verify its signature + claims against Google's public keys.
// No client secret is involved. GOOGLE_CLIENT_ID must be the iOS client id, since
// that is the audience of the tokens the app sends.
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function verifyGoogleIdToken(idToken: string): Promise<OAuthProfile> {
  const clientId = required("GOOGLE_CLIENT_ID", env.GOOGLE_CLIENT_ID);

  let claims;
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });
    claims = payload as {
      sub: string;
      email?: string;
      email_verified?: boolean | string;
      name?: string;
      picture?: string;
    };
  } catch {
    throw new OAuthError("Invalid Google ID token");
  }

  if (!claims.email) throw new OAuthError("Google account has no email");

  return {
    provider: "google",
    providerAccountId: claims.sub,
    email: claims.email,
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    name: claims.name ?? null,
    avatarUrl: claims.picture ?? null,
  };
}

// --- Discord (OAuth2) ---
// The app obtains a PKCE auth code; we exchange it here using the client secret.
export async function exchangeDiscord(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<OAuthProfile> {
  const clientId = required("DISCORD_CLIENT_ID", env.DISCORD_CLIENT_ID);
  const clientSecret = required("DISCORD_CLIENT_SECRET", env.DISCORD_CLIENT_SECRET);

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!tokenRes.ok) throw new OAuthError(`Discord token exchange failed: ${await tokenRes.text()}`);

  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new OAuthError("Discord did not return an access_token");

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) throw new OAuthError(`Discord profile fetch failed: ${await userRes.text()}`);

  const u = (await userRes.json()) as {
    id: string;
    email?: string;
    verified?: boolean;
    username?: string;
    global_name?: string;
    avatar?: string;
  };
  if (!u.email) throw new OAuthError("Discord account has no email");

  return {
    provider: "discord",
    providerAccountId: u.id,
    email: u.email,
    emailVerified: u.verified === true,
    name: u.global_name ?? u.username ?? null,
    avatarUrl: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null,
  };
}
