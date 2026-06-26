"use client";

import * as React from "react";
import { Server } from "lucide-react";
import { useServerStatus } from "@/hooks/useServerStatus";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { EC2InstanceCard } from "@/components/dashboard/EC2InstanceCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const {
    status,
    isLoading,
    operationType,
    operationStep,
    lastUpdated,
    error,
    toasts,
    removeToast,
    startServer,
    stopServer,
    refresh,
  } = useServerStatus();

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-background text-foreground transition-colors duration-300 relative">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 min-w-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
          <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] shrink-0">
            <Server className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold tracking-tight text-foreground bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400 bg-clip-text truncate">
              MineControl
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-normal hidden xs:block sm:block truncate">
              Minecraft Server Management
            </p>
          </div>
        </div>

        {/* Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-6 md:py-8 flex flex-col gap-5 sm:gap-6 md:gap-8 relative z-10">

        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 sm:py-20 bg-card/40 border border-border rounded-2xl backdrop-blur-sm mx-0" role="alert">
            <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400">
              <Server className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <p className="text-rose-500 dark:text-rose-400 font-medium text-sm sm:text-base text-center px-4">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 px-5 py-2.5 bg-muted hover:bg-accent text-foreground rounded-lg border border-border hover:border-foreground/30 transition-all font-semibold cursor-pointer text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Retry
            </button>
          </div>
        ) : !status ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* 4 Statistics Cards Grid */}
            <DashboardGrid status={status} />

            {/* Full-width EC2 Card */}
            <EC2InstanceCard status={status} />

            {/* Full-width Operations Panel */}
            <ControlPanel
              status={status}
              onStart={startServer}
              onStop={stopServer}
              onRefresh={refresh}
              isRefreshing={isLoading}
              operationType={operationType}
              operationStep={operationStep}
              lastUpdated={lastUpdated}
            />
          </>
        )}

      </main>

      {/* Floating toast notifications */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`p-3 sm:p-4 rounded-xl border shadow-xl flex items-center justify-between pointer-events-auto cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : toast.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/90 border-rose-500/30 text-rose-700 dark:text-rose-400"
                : toast.type === "warning"
                ? "bg-amber-50 dark:bg-amber-950/90 border-amber-500/30 text-amber-700 dark:text-amber-400"
                : "bg-cyan-50 dark:bg-cyan-950/90 border-cyan-500/30 text-cyan-700 dark:text-cyan-400"
            }`}
          >
            <span className="text-xs sm:text-sm font-semibold leading-snug pr-2">{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="text-xs opacity-60 hover:opacity-100 font-bold font-mono shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
