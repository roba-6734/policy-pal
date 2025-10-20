import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GetSummaryResponse, getPolicySummary } from "@/services/api";

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

  const ensureLoaded = async (ids: string[]) => {
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
  };

  const open = (ids: string[]) => {
    setOpenIds((prev) => {
      const set = new Set(prev);
      for (const id of ids) set.add(id);
      const next = Array.from(set);
      if (!activeId && next.length) setActiveId(next[0]);
      return next;
    });
  };

  const setActive = (id: string) => {
    setActiveId(id);
  };

  const close = (id: string) => {
    setOpenIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      if (activeId === id) setActiveId(next[0] ?? null);
      return next;
    });
  };

  const value = useMemo(
    () => ({ summariesById, openIds, activeId, open, setActive, close, ensureLoaded }),
    [summariesById, openIds, activeId]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
};


