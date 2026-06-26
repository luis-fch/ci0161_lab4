import { z } from "zod";

// Request body schemas. Validation errors return 400 with the first message.
export const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

// Google: the app sends a Google ID token, verified server-side.
export const googleOAuthSchema = z.object({
  idToken: z.string().min(1),
});

// Discord: the app sends a PKCE auth code, exchanged server-side.
export const discordOAuthSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(1),
  redirectUri: z.string().min(1),
});
