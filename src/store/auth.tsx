import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getStaffToken, setStaffToken } from "@/lib/api";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  centreName: string;
  role: "owner" | "teacher";
}

const STORAGE_KEY = "tuitionos.session";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      if (!getStaffToken()) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const { data } = await api<{ user: AuthUser }>("/v1/auth/me");
        if (!cancelled) {
          setUser(data.user);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        }
      } catch {
        setStaffToken(null);
        window.localStorage.removeItem(STORAGE_KEY);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login: (next, accessToken) => {
        setUser(next);
        setStaffToken(accessToken);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      },
      logout: async () => {
        try {
          await api("/v1/auth/logout", { method: "POST" });
        } catch {
          /* still clear locally */
        }
        setUser(null);
        setStaffToken(null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
