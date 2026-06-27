import { useState, useEffect, useCallback, useRef } from "react";

export type ActivityStatus = "success" | "error" | "info";

export interface ActivityItem {
  id: string;
  /** Short machine label: start | stop | refresh */
  kind: "start" | "stop" | "refresh";
  status: ActivityStatus;
  message: string;
  /** ISO timestamp */
  at: string;
}

const STORAGE_KEY = "minecontrol:activity";
const MAX_ENTRIES = 20;

function loadFromStorage(): ActivityItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ActivityItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Persisted, device-local activity log of server operations performed from
 * this browser. Capped at the most recent {@link MAX_ENTRIES} entries.
 * No backend — this is honest "recent activity on this device".
 */
export function useActivityLog() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const counterRef = useRef(0);

  // Hydrate after mount to avoid SSR/client markup mismatch.
  useEffect(() => {
    setActivity(loadFromStorage());
  }, []);

  const logActivity = useCallback(
    (kind: ActivityItem["kind"], status: ActivityStatus, message: string) => {
      setActivity((prev) => {
        counterRef.current += 1;
        const entry: ActivityItem = {
          id: `${kind}-${counterRef.current}-${prev.length}`,
          kind,
          status,
          message,
          at: new Date().toISOString(),
        };
        const next = [entry, ...prev].slice(0, MAX_ENTRIES);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore quota / privacy-mode failures.
        }
        return next;
      });
    },
    []
  );

  const clearActivity = useCallback(() => {
    setActivity([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  return { activity, logActivity, clearActivity };
}
