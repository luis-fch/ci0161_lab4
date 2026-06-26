// Thin client for the auth backend. The base URL is public (no secrets here).
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

export type AuthResponse = { token: string; user: SafeUser };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    const message = typeof data?.error === "string" ? data.error : "Request failed";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export const api = {
  signup: (body: { email: string; password: string; name?: string }) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body }),

  oauthGoogle: (idToken: string) =>
    request<AuthResponse>("/auth/oauth/google", { method: "POST", body: { idToken } }),

  oauthDiscord: (body: { code: string; codeVerifier: string; redirectUri: string }) =>
    request<AuthResponse>("/auth/oauth/discord", { method: "POST", body }),

  me: (token: string) => request<{ user: SafeUser }>("/me", { token }),
};
