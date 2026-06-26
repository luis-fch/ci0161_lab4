import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { api, type SafeUser } from "@/lib/api";
import * as store from "@/lib/secure-store";

type OAuthPayload = { code: string; codeVerifier: string; redirectUri: string };

type AuthContextValue = {
  user: SafeUser | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: { email: string; password: string; name?: string }) => Promise<void>;
  completeGoogle: (idToken: string) => Promise<void>;
  completeDiscord: (payload: OAuthPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore a persisted session on launch.
  useEffect(() => {
    (async () => {
      try {
        const token = await store.getToken();
        if (token) {
          const me = await api.me(token);
          setUser(me.user);
        }
      } catch {
        // Token missing/expired/invalid — start signed out.
        await store.deleteToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function persist(res: { token: string; user: SafeUser }) {
    await store.setToken(res.token);
    setUser(res.user);
  }

  const value: AuthContextValue = {
    user,
    isLoading,
    signInWithEmail: async (email, password) => {
      await persist(await api.login({ email, password }));
    },
    signUpWithEmail: async (input) => {
      await persist(await api.signup(input));
    },
    completeGoogle: async (idToken) => {
      await persist(await api.oauthGoogle(idToken));
    },
    completeDiscord: async (payload) => {
      await persist(await api.oauthDiscord(payload));
    },
    signOut: async () => {
      await store.deleteToken();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
