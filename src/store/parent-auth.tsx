import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getParentToken, setParentToken } from "@/lib/api";

const STORAGE_KEY = "tuitionos.parent-session";
const CHILD_KEY = "tuitionos.parent-child";

export interface ParentSession {
  parentId: string;
  name: string;
  contact: string;
}

interface ParentAuthValue {
  parent: ParentSession | null;
  ready: boolean;
  activeChildId: string | null;
  login: (session: ParentSession, accessToken: string, childId?: string) => void;
  logout: () => Promise<void>;
  setActiveChildId: (id: string) => void;
}

const ParentAuthContext = createContext<ParentAuthValue | null>(null);

export function ParentAuthProvider({ children }: { children: ReactNode }) {
  const [parent, setParent] = useState<ParentSession | null>(null);
  const [activeChildId, setChild] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      if (!getParentToken()) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const { data } = await api<{
          parent: { id: string; name: string; phone: string; email: string };
          children: { id: string }[];
        }>("/v1/parent/auth/me");
        if (cancelled) return;
        const session = {
          parentId: data.parent.id,
          name: data.parent.name,
          contact: data.parent.phone,
        };
        setParent(session);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        const saved = window.localStorage.getItem(CHILD_KEY);
        const nextChild =
          (saved && data.children.some((c) => c.id === saved) ? saved : data.children[0]?.id) ?? null;
        setChild(nextChild);
        if (nextChild) window.localStorage.setItem(CHILD_KEY, nextChild);
      } catch {
        setParentToken(null);
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(CHILD_KEY);
        if (!cancelled) {
          setParent(null);
          setChild(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveChildId = useCallback((id: string) => {
    setChild(id);
    try {
      window.localStorage.setItem(CHILD_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ParentAuthValue>(
    () => ({
      parent,
      ready,
      activeChildId,
      setActiveChildId,
      login: (session, accessToken, childId) => {
        setParent(session);
        setParentToken(accessToken);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
          /* ignore */
        }
        if (childId) {
          setChild(childId);
          try {
            window.localStorage.setItem(CHILD_KEY, childId);
          } catch {
            /* ignore */
          }
        }
      },
      logout: async () => {
        try {
          await api("/v1/parent/auth/logout", { method: "POST" });
        } catch {
          /* still clear locally */
        }
        setParent(null);
        setChild(null);
        setParentToken(null);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
          window.localStorage.removeItem(CHILD_KEY);
        } catch {
          /* ignore */
        }
      },
    }),
    [parent, ready, activeChildId, setActiveChildId],
  );

  return <ParentAuthContext.Provider value={value}>{children}</ParentAuthContext.Provider>;
}

export function useParentAuth() {
  const ctx = useContext(ParentAuthContext);
  if (!ctx) throw new Error("useParentAuth must be used inside ParentAuthProvider");
  return ctx;
}
