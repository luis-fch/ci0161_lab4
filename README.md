# lab4 — Auth example

A small, readable example of authentication in an Expo app backed by a Bun/Express API.
It shows two ways to sign in, both ending in the same place:

1. Custom email/password auth (our own).
2. Third-party OAuth with Google and Discord.

In both cases the backend issues its own signed session token (a JWT). The app stores it
with `expo-secure-store` and sends it as a `Bearer` token to read the current user. Logout
deletes the token. The app has a single signed-in screen showing the user's info and a
logout button.

## Layout

- `app/` — Expo SDK 56 app (Expo Router, Bun).
- `backend/` — Bun + Express 5 + Prisma 7 + PostgreSQL.
- `app/example/` — the original starter template, kept for reference only.

## How it works

- Both auth methods finish with the backend signing a JWT (HS256, 7-day expiry). The app
  persists it and calls `GET /me` to restore the session on launch.
- Custom auth: passwords are hashed and salted with argon2id (`Bun.password`).
- Google: the app uses a native iOS OAuth client and obtains a Google ID token; the backend
  verifies it against Google's public keys. No client secret is involved.
- Discord: the app obtains a PKCE authorization code; the backend exchanges it using the
  Discord client secret.
- No secrets live in the app. It only embeds public values (OAuth client IDs and the API
  URL). Every secret stays in `backend/.env`.

## Backend

Stack: Bun, Express 5, Prisma 7 (PostgreSQL via the `@prisma/adapter-pg` driver adapter),
`jose` (JWT), `zod` (validation), `Bun.password` (hashing).

### Setup

1. `cd backend && bun install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — PostgreSQL connection string.
   - `JWT_SECRET` — a long random string (`openssl rand -hex 32`).
   - `GOOGLE_CLIENT_ID` — the Google iOS client id (the audience of the ID tokens the app
     sends). No secret is needed.
   - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`.
3. `bunx prisma db push` — create the tables.
4. `bun run index.ts` — starts the API on `http://localhost:3000`.

### Endpoints

| Method | Path                    | Body                                   | Returns         |
| ------ | ----------------------- | -------------------------------------- | --------------- |
| POST   | `/auth/signup`          | `{ email, password, name? }`           | `{ token, user }` |
| POST   | `/auth/login`           | `{ email, password }`                  | `{ token, user }` |
| POST   | `/auth/oauth/google`    | `{ idToken }`                          | `{ token, user }` |
| POST   | `/auth/oauth/discord`   | `{ code, codeVerifier, redirectUri }`  | `{ token, user }` |
| GET    | `/me`                   | — (`Authorization: Bearer <jwt>`)      | `{ user }`      |

`user` is always the safe shape `{ id, email, name, avatarUrl }` — never the password hash.

### Data model

- `User` — `id, email, name?, avatarUrl?, passwordHash?, createdAt`.
- `Account` — links an OAuth identity (`provider`, `providerAccountId`) to a `User`.

Email/password users have a `passwordHash` and no `Account`. OAuth users get an `Account`
row. A verified email links to a single user across methods.

## App

Stack: Expo SDK 56, Expo Router, `expo-auth-session`, `expo-secure-store`.

### Setup

1. `cd app && bun install`
2. Copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_API_URL` — backend URL (`http://localhost:3000` on the iOS simulator).
   - `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — the Google iOS client id.
   - `EXPO_PUBLIC_DISCORD_CLIENT_ID` — the Discord client id.
3. `npx expo run:ios` — builds and runs the dev client. A dev client (not Expo Go) is
   required because of the native modules and the custom URL scheme.

### Screens and routing

- `(auth)/login`, `(auth)/signup` — shown when signed out.
- `index` — protected home (user info + logout), shown when signed in.

Routing is gated by `Stack.Protected` in `src/app/_layout.tsx` based on the auth state from
`src/lib/auth-context.tsx`.

## OAuth provider setup

### Google (iOS)

Create an iOS OAuth client in the Google Cloud console for the app's bundle id
(`com.luisfch.app`). iOS clients need no redirect URI registration and have no secret. Use
the same client id for `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (app) and `GOOGLE_CLIENT_ID` (backend).

### Discord

Create an application in the Discord Developer Portal. Under OAuth2, add the redirect URI
`app://oauth` and use the scopes `identify` and `email`. Put the client id in
`EXPO_PUBLIC_DISCORD_CLIENT_ID` (app) and the client id plus secret in the backend `.env`.

## Security notes

- Secrets (`DATABASE_URL`, `JWT_SECRET`, Discord secret) live only in `backend/.env`, which
  is gitignored. The app embeds only public values.
- Passwords are hashed and salted with argon2id.
- Google ID tokens are verified against Google's public keys, and accounts are only linked
  when the provider reports the email as verified.

## Scope

Kept intentionally minimal: stateless JWT with client-side logout (no refresh tokens), and
no email verification, password reset, or rate limiting. `expo-secure-store` is native-only,
so the app targets iOS and Android.
