import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  login: (session: ParentSession) => void;
  logout: () => void;
  setActiveChildId: (id: string) => void;
}

const ParentAuthContext = createContext<ParentAuthValue | null>(null);

export function ParentAuthProvider({ children }: { children: ReactNode }) {
  const [parent, setParent] = useState<ParentSession | null>(null);
  const [activeChildId, setChild] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setParent(JSON.parse(raw) as ParentSession);
      const child = window.localStorage.getItem(CHILD_KEY);
      if (child) setChild(child);
    } catch {
      /* ignore */
    }
    setReady(true);
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
      login: (session) => {
        setParent(session);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch {
          /* ignore */
        }
      },
      logout: () => {
        setParent(null);
        setChild(null);
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
