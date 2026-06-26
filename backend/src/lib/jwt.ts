import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

// Stateless session tokens. Logout is handled client-side by deleting the token.
const secret = new TextEncoder().encode(env.JWT_SECRET);
const ALG = "HS256";
const EXPIRES_IN = "7d";

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(secret);
}

// Returns the user id from a valid token, or throws if invalid/expired.
export async function verifySession(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
  if (!payload.sub) throw new Error("Token missing subject");
  return payload.sub;
}
