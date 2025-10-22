import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GetSummaryResponse, getPolicySummary } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

type WorkspaceContextValue = {
  summariesById: Record<string, GetSummaryResponse>;
  openIds: string[];
  activeId: string | null;
  open: (ids: string[]) => void;
  setActive: (id: string) => void;
  close: (id: string) => void;
  ensureLoaded: (ids: string[]) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const OPEN_IDS_KEY = "workspace.openIds";
const ACTIVE_ID_KEY = "workspace.activeId";

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [summariesById, setSummariesById] = useState<Record<string, GetSummaryResponse>>({});
  const [openIds, setOpenIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(OPEN_IDS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_ID_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_IDS_KEY, JSON.stringify(openIds));
    } catch {}
  }, [openIds]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_ID_KEY, activeId);
      else localStorage.removeItem(ACTIVE_ID_KEY);
    } catch {}
  }, [activeId]);

  const inflight = useRef<Set<string>>(new Set());

  const ensureLoaded = useCallback(
    async (ids: string[]) => {
      const toFetch = ids.filter((id) => !summariesById[id] && !inflight.current.has(id));
      if (toFetch.length === 0) return;
      toFetch.forEach((id) => inflight.current.add(id));
      try {
        const results = await Promise.all(
          toFetch.map(async (id) => {
            const summary = await getPolicySummary(id);
            return summary;
          })
        );
        setSummariesById((prev) => {
          const next = { ...prev };
          for (const s of results) next[s.summary_id] = s;
          return next;
        });
      } finally {
        toFetch.forEach((id) => inflight.current.delete(id));
      }
    },
    [summariesById]
  );

  const open = useCallback((ids: string[]) => {
    setOpenIds((prev) => {
      const set = new Set(prev);
      for (const id of ids) set.add(id);
      const next = Array.from(set);
      setActiveId((current) => current ?? next[0] ?? null);
      return next;
    });
  }, []);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const close = useCallback((id: string) => {
    setOpenIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      setActiveId((current) => (current === id ? next[0] ?? null : current));
      return next;
    });
  }, []);

  const { token } = useAuth();
  const hasInitialised = useRef(false);

  useEffect(() => {
    if (!hasInitialised.current) {
      hasInitialised.current = true;
      return;
    }

    setSummariesById({});
    setOpenIds([]);
    setActiveId(null);
    try {
      localStorage.removeItem(OPEN_IDS_KEY);
      localStorage.removeItem(ACTIVE_ID_KEY);
    } catch {}
  }, [token]);

  const value = useMemo(
    () => ({ summariesById, openIds, activeId, open, setActive, close, ensureLoaded }),
    [summariesById, openIds, activeId, open, setActive, close, ensureLoaded]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
};


