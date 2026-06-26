# app

The mobile app for the [lab4 auth example](../README.md) — Expo SDK 56 with Expo Router.

## Run

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` and the OAuth client IDs.

3. Make sure the [backend](../backend) is running.

4. Build and launch the iOS dev client:

   ```bash
   bun run ios
   ```

   A dev client (not Expo Go) is required because of the native modules and the custom URL
   scheme.

See the [main README](../README.md) for the architecture, screens, and OAuth provider setup.
