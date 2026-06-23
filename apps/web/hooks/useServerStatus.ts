import { useState } from "react";
import useSWR from "swr";
import { ServerStatus } from "@minecontrol/types";

const fetcher = async (url: string): Promise<ServerStatus> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to retrieve server status");
  }
  return res.json();
};

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export function useServerStatus() {
  const [isOperating, setIsOperating] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const { data, error, isLoading, mutate } = useSWR<ServerStatus>("/api/status", fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  const addToast = (message: string, type: "success" | "error" | "info" | "warning") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refresh = () => {
    mutate();
  };

  const startServer = async () => {
    if (isOperating) return;
    setIsOperating(true);
    try {
      const res = await fetch("/api/start", { method: "POST" });
      if (!res.ok) {
        throw new Error("Network request failed.");
      }
      const result = await res.json();
      if (result.status === "online") {
        addToast("Server started successfully.", "success");
      } else if (result.status === "already_running") {
        addToast("Server is already running.", "info");
      } else if (result.status === "already_starting") {
        addToast("Server startup is already in progress.", "info");
      } else if (result.status === "shutdown_in_progress") {
        addToast("Failed to start server: shutdown is in progress.", "warning");
      } else {
        addToast(`Failed to start server: ${result.message || "Unknown error"}`, "error");
      }
    } catch (err) {
      console.error("[useServerStatus] Start server error:", err);
      addToast("Failed to start server.", "error");
    } finally {
      setIsOperating(false);
      mutate();
    }
  };

  const stopServer = () => {
    console.log("Stop server action triggered (not implemented in Phase 5)");
  };

  return {
    status: data || null,
    isLoading: isLoading && !data,
    isOperating,
    error: error ? "Unable to retrieve server status." : null,
    toasts,
    removeToast,
    startServer,
    stopServer,
    refresh,
  };
}
