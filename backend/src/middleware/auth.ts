import type { Request, Response, NextFunction } from "express";
import { verifySession } from "../lib/jwt";

export interface AuthedRequest extends Request {
  userId?: string;
}

// Verifies the `Authorization: Bearer <jwt>` header and attaches req.userId.
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  try {
    req.userId = await verifySession(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
