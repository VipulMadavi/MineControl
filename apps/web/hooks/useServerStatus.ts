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
  const [operationType, setOperationType] = useState<"starting" | "stopping" | null>(null);
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
    if (operationType) return;
    setOperationType("starting");
    try {
      const res = await fetch("/api/start", { method: "POST" });
      if (!res.ok) {
        throw new Error("Network request failed.");
      }
      const result = await res.json();
      if (result.status === "online") {
        addToast("Server started successfully.", "success");
      } else if (result.status === "minecraft_restarted") {
        addToast("Minecraft server recovered successfully.", "success");
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
      setOperationType(null);
      mutate();
    }
  };

  const stopServer = async () => {
    if (operationType) return;
    setOperationType("stopping");
    try {
      const res = await fetch("/api/stop", { method: "POST" });
      if (!res.ok) {
        throw new Error("Network request failed.");
      }
      const result = await res.json();
      if (result.status === "stopped") {
        addToast("Server stopped successfully.", "success");
      } else if (result.status === "already_off") {
        addToast("Server is already stopped.", "info");
      } else if (result.status === "startup_in_progress") {
        addToast("Failed to stop: startup is in progress.", "warning");
      } else if (result.status === "already_stopping") {
        addToast("Server shutdown is already in progress.", "info");
      } else {
        addToast(`Failed to stop server: ${result.message || "Unknown error"}`, "error");
      }
    } catch (err) {
      console.error("[useServerStatus] Stop server error:", err);
      addToast("Failed to stop server.", "error");
    } finally {
      setOperationType(null);
      mutate();
    }
  };

  return {
    status: data || null,
    isLoading: isLoading && !data,
    isOperating: operationType !== null,
    operationType,
    error: error ? "Unable to retrieve server status." : null,
    toasts,
    removeToast,
    startServer,
    stopServer,
    refresh,
  };
}
