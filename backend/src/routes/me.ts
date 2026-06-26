import { Router } from "express";
import type { Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { toSafeUser } from "../lib/user";

const router = Router();

// GET /me — return the signed-in user. Used by the app to restore a session.
router.get("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ user: toSafeUser(user) });
});

export default router;
