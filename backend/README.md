# backend

The API for the [lab4 auth example](../README.md) — Bun + Express + Prisma + PostgreSQL.

## Run

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `JWT_SECRET`, and the OAuth
   client values.

3. Create the database tables:

   ```bash
   bunx prisma db push
   ```

4. Start the server (runs on http://localhost:3000):

   ```bash
   bun run index.ts
   ```

See the [main README](../README.md) for the architecture, endpoints, and OAuth provider setup.
