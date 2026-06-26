import { Router } from "express";
import { prisma } from "../lib/prisma";
import { signSession } from "../lib/jwt";
import { signupSchema, loginSchema, googleOAuthSchema, discordOAuthSchema } from "../schemas";
import { verifyGoogleIdToken, exchangeDiscord, OAuthError } from "../lib/oauth";
import type { OAuthProfile } from "../lib/oauth";
import { toSafeUser } from "../lib/user";

const router = Router();

// POST /auth/signup — create an email/password account.
router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  // Bun.password.hash defaults to argon2id with a per-password random salt.
  const passwordHash = await Bun.password.hash(parsed.data.password);
  const user = await prisma.user.create({
    data: { email, name: parsed.data.name ?? null, passwordHash },
  });

  const token = await signSession(user.id);
  res.status(201).json({ token, user: toSafeUser(user) });
});

// POST /auth/login — verify email/password credentials.
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user?.passwordHash
    ? await Bun.password.verify(parsed.data.password, user.passwordHash)
    : false;
  if (!user || !ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = await signSession(user.id);
  res.json({ token, user: toSafeUser(user) });
});

// POST /auth/oauth/:provider — sign in / sign up via Google or Discord.
// Google sends an id_token (verified here); Discord sends a PKCE code (exchanged here).
router.post("/oauth/:provider", async (req, res) => {
  const provider = req.params.provider;

  let profile: OAuthProfile;
  try {
    if (provider === "google") {
      const parsed = googleOAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      profile = await verifyGoogleIdToken(parsed.data.idToken);
    } else if (provider === "discord") {
      const parsed = discordOAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
        return;
      }
      profile = await exchangeDiscord(parsed.data.code, parsed.data.codeVerifier, parsed.data.redirectUri);
    } else {
      res.status(404).json({ error: "Unknown provider" });
      return;
    }
  } catch (err) {
    if (err instanceof OAuthError) {
      res.status(401).json({ error: err.message });
      return;
    }
    throw err;
  }

  // Only link accounts by email when the provider says the email is verified.
  if (!profile.emailVerified) {
    res.status(401).json({ error: "Provider email is not verified" });
    return;
  }

  const email = profile.email.toLowerCase();
  const accountKey = {
    provider_providerAccountId: {
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    },
  };

  // Link by verified email: reuse an existing user or create one, and ensure the
  // OAuth account row exists.
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      accounts: { create: { provider: profile.provider, providerAccountId: profile.providerAccountId } },
    },
    update: {
      name: profile.name ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      accounts: {
        connectOrCreate: {
          where: accountKey,
          create: { provider: profile.provider, providerAccountId: profile.providerAccountId },
        },
      },
    },
  });

  const token = await signSession(user.id);
  res.json({ token, user: toSafeUser(user) });
});

export default router;
