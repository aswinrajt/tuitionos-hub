import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AuthUser {
  name: string;
  email: string;
  centreName: string;
  role: "owner" | "teacher";
}

const STORAGE_KEY = "tuitionos.session";

export const DEMO_USER: AuthUser = {
  name: "Anil Kumar",
  email: "anil@vidyaclasses.in",
  centreName: "Vidya Classes",
  role: "owner",
};

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login: (next) => {
        setUser(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      },
      logout: () => {
        setUser(null);
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
