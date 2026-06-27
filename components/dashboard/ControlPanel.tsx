"use client";

import * as React from "react";
import { ServerStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { RefreshCw, Sliders, Clock } from "lucide-react";

interface ControlPanelProps {
  status: ServerStatus;
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  operationType?: "starting" | "stopping" | null;
  operationStep?: string;
  lastUpdated?: Date | null;
}

export function ControlPanel({
  status,
  onStart,
  onStop,
  onRefresh,
  isRefreshing = false,
  operationType = null,
  operationStep = "",
  lastUpdated = null,
}: ControlPanelProps) {
  const { ec2, minecraft } = status;
  const [confirmStopOpen, setConfirmStopOpen] = React.useState(false);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  return (
    <Card className="bg-card/40 border-border backdrop-blur-md flex flex-col rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider">Operations</span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">Server Controls</CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80 font-normal leading-relaxed">
          Trigger virtual machine actions and automation controls.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 sm:gap-5 pt-2 pb-5 sm:pb-6">
        {/* Current Operation Status — only shown when operation is active */}
        {operationType && (
          <div role="status" aria-live="polite" className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] flex flex-col gap-2 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Current Operation</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">
                {operationType === "starting" ? "Starting Minecraft Server" : "Stopping Minecraft Server"}
              </span>
              <span className="text-xs text-muted-foreground/80 font-normal leading-none mt-0.5">
                {operationStep}
              </span>
            </div>
          </div>
        )}

        {/* Infrastructure state pill */}
        <div className="p-3 sm:p-4 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">Infrastructure state</span>
            <span className="text-sm font-semibold text-foreground/90 capitalize">
              EC2: {ec2.state} | MC: {minecraft.state}
            </span>
          </div>
          <span className="text-xs text-muted-foreground/60 font-mono shrink-0">
            ap-south-1
          </span>
        </div>

        {/* Buttons — stack on mobile, 3-col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Start Server */}
          <Button
            id="btn-start-server"
            onClick={onStart}
            disabled={ec2.state !== "stopped" || isRefreshing || operationType !== null}
            className="h-12 sm:h-12 bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-neutral-200 dark:disabled:bg-neutral-800/80 disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-all font-semibold gap-2 rounded-lg cursor-pointer text-sm touch-manipulation"
          >
            {operationType === "starting" ? "⏳ Starting..." : "Start Server"}
          </Button>

          {/* Stop Server */}
          <Button
            id="btn-stop-server"
            onClick={() => setConfirmStopOpen(true)}
            disabled={ec2.state !== "running" || minecraft.state !== "online" || isRefreshing || operationType !== null}
            variant="destructive"
            className="h-12 sm:h-12 bg-rose-600/90 hover:bg-rose-500 text-white disabled:bg-neutral-200 dark:disabled:bg-neutral-800/80 disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-all font-semibold gap-2 rounded-lg cursor-pointer text-sm touch-manipulation"
          >
            {operationType === "stopping" ? "⏳ Stopping..." : "Stop Server"}
          </Button>

          {/* Refresh */}
          <Button
            id="btn-refresh-status"
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="h-12 sm:h-12 border-border bg-card/50 hover:bg-accent text-foreground hover:text-accent-foreground transition-all font-semibold gap-2 rounded-lg cursor-pointer disabled:bg-neutral-200 dark:disabled:bg-neutral-800/80 disabled:text-neutral-400 dark:disabled:text-neutral-500 text-sm touch-manipulation"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh Status"
            )}
          </Button>
        </div>
      </CardContent>

      {/* Last Updated footer */}
      <CardFooter className="pt-3 pb-4 sm:pb-5 px-4 sm:px-6 flex items-center justify-between gap-2 border-t border-border/50 mt-auto">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="text-[11px] text-muted-foreground/50 font-normal truncate">
            {lastUpdated ? (
              <>Last updated: <span className="font-mono">{formatTime(lastUpdated)}</span></>
            ) : (
              "Awaiting first refresh..."
            )}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">Auto · 30s</span>
      </CardFooter>

      <ConfirmDialog
        open={confirmStopOpen}
        onOpenChange={setConfirmStopOpen}
        title="Stop the Minecraft server?"
        description={
          <>
            This will stop the Minecraft application and shut down the EC2
            instance ({ec2.state} / {minecraft.state}). Players will be
            disconnected and the world saved before shutdown.
          </>
        }
        confirmLabel="Stop Server"
        cancelLabel="Cancel"
        destructive
        onConfirm={onStop}
      />
    </Card>
  );
}
