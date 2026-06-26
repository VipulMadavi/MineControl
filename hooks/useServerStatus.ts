import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { ServerStatus } from "@/types";
import { useActivityLog } from "@/hooks/useActivityLog";

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
  const [operationStep, setOperationStep] = useState<string>("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tabVisible, setTabVisible] = useState(true);
  const { activity, logActivity, clearActivity } = useActivityLog();

  // Smart refresh: pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setTabVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const { data, error, isLoading, mutate } = useSWR<ServerStatus>("/api/status", fetcher, {
    refreshInterval: tabVisible ? 30000 : 0,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    onSuccess: () => setLastUpdated(new Date()),
  });

  // Operation step sequencing
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    if (operationType === "starting") {
      setOperationStep("⏳ Starting EC2...");

      timers.push(
        setTimeout(() => {
          setOperationStep("⏳ Waiting for AWS...");
        }, 5000)
      );

      timers.push(
        setTimeout(() => {
          setOperationStep("⏳ Starting Minecraft...");
        }, 12000)
      );

      timers.push(
        setTimeout(() => {
          setOperationStep("⏳ Waiting for startup confirmation...");
        }, 22000)
      );
    } else if (operationType === "stopping") {
      setOperationStep("⏳ Sending stop command...");

      timers.push(
        setTimeout(() => {
          setOperationStep("⏳ Saving world data...");
        }, 4000)
      );

      timers.push(
        setTimeout(() => {
          setOperationStep("⏳ Stopping EC2...");
        }, 9000)
      );
    } else {
      setOperationStep("");
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [operationType]);

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

  const refresh = useCallback(() => {
    logActivity("refresh", "info", "Status refreshed");
    mutate().then(() => setLastUpdated(new Date()));
  }, [mutate, logActivity]);

  const startServer = async () => {
    if (operationType) return;
    setOperationType("starting");
    try {
      const res = await fetch("/api/start", { method: "POST" });
      if (!res.ok) {
        throw new Error("Network request failed.");
      }
      const result = await res.json();
      if (result.status === "online" || result.status === "minecraft_restarted") {
        addToast("✅ Server started successfully", "success");
        logActivity("start", "success", "Server started successfully");
      } else if (result.status === "already_running") {
        addToast("Server is already running.", "info");
      } else if (result.status === "already_starting") {
        addToast("Server startup is already in progress.", "info");
      } else if (result.status === "shutdown_in_progress") {
        addToast("Failed to start server: shutdown is in progress.", "warning");
      } else {
        addToast(`Failed to start server: ${result.message || "Unknown error"}`, "error");
        logActivity("start", "error", result.message || "Failed to start server");
      }
    } catch (err) {
      console.error("[useServerStatus] Start server error:", err);
      addToast("Failed to start server.", "error");
      logActivity("start", "error", "Failed to start server");
    } finally {
      setOperationType(null);
      mutate().then(() => setLastUpdated(new Date()));
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
        addToast("🛑 Server stopped successfully", "success");
        logActivity("stop", "success", "Server stopped successfully");
      } else if (result.status === "already_off") {
        addToast("Server is already stopped.", "info");
      } else if (result.status === "startup_in_progress") {
        addToast("Failed to stop: startup is in progress.", "warning");
      } else if (result.status === "already_stopping") {
        addToast("Server shutdown is already in progress.", "info");
      } else {
        addToast(`Failed to stop server: ${result.message || "Unknown error"}`, "error");
        logActivity("stop", "error", result.message || "Failed to stop server");
      }
    } catch (err) {
      console.error("[useServerStatus] Stop server error:", err);
      addToast("Failed to stop server.", "error");
      logActivity("stop", "error", "Failed to stop server");
    } finally {
      setOperationType(null);
      mutate().then(() => setLastUpdated(new Date()));
    }
  };

  const toggleAutostop = async () => {
    try {
      const res = await fetch("/api/autostop/toggle", { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const result = await res.json();
      if (result.success) {
        const state = result.enabled ? "enabled" : "disabled";
        addToast(`Auto-shutdown ${state}`, result.enabled ? "success" : "warning");
        logActivity("refresh", "info", `Auto-shutdown ${state}`);
      } else {
        addToast(result.error || "Failed to toggle auto-shutdown", "error");
      }
    } catch (err) {
      console.error("[useServerStatus] toggleAutostop error:", err);
      addToast("Failed to toggle auto-shutdown.", "error");
    } finally {
      mutate();
    }
  };

  return {
    status: data || null,
    isLoading: isLoading && !data,
    isOperating: operationType !== null,
    operationType,
    operationStep,
    lastUpdated,
    error: error ? "Unable to retrieve server status." : null,
    toasts,
    removeToast,
    startServer,
    stopServer,
    refresh,
    activity,
    clearActivity,
    toggleAutostop,
  };
}
