"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Timer, ShieldCheck, ShieldOff, Wrench } from "lucide-react";
import type { AutostopStatus } from "@/types";

interface AutoStopCardProps {
  autostop: AutostopStatus;
  onToggle: () => void;
  onSetMaintenance: (hours: number) => void;
}

function getTimeRemaining(iso: string): string {
  const diff = Date.parse(iso) - Date.now();
  if (diff <= 0) return "expiring...";
  const mins = Math.ceil(diff / 60_000);
  if (mins < 60) return `${mins}m left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AutoStopCard({ autostop, onToggle, onSetMaintenance }: AutoStopCardProps) {
  const [confirmDisableOpen, setConfirmDisableOpen] = React.useState(false);
  const [customHours, setCustomHours] = React.useState("");
  const [optimisticEnabled, setOptimisticEnabled] = React.useState<boolean | null>(null);

  // Sync optimistic state when real data arrives
  React.useEffect(() => {
    setOptimisticEnabled(null);
  }, [autostop.enabled]);

  const effectiveEnabled = optimisticEnabled ?? autostop.enabled;
  const inMaintenance = !!autostop.maintenanceUntil &&
    Date.now() < Date.parse(autostop.maintenanceUntil);

  const handleSwitchChange = (checked: boolean) => {
    if (!checked) {
      setConfirmDisableOpen(true);
    } else {
      setOptimisticEnabled(true);
      onToggle();
    }
  };

  const handleConfirmDisable = () => {
    setOptimisticEnabled(false);
    onToggle();
  };

  const handleCustomPause = () => {
    const val = parseFloat(customHours);
    if (val > 0 && val <= 24) {
      onSetMaintenance(val);
      setCustomHours("");
    }
  };

  // Status indicator
  const statusConfig = !effectiveEnabled
    ? { icon: ShieldOff, label: "OFF — server runs until you stop it manually", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" }
    : inMaintenance
    ? { icon: Wrench, label: `Server kept alive until ${formatTime(autostop.maintenanceUntil!)} (${getTimeRemaining(autostop.maintenanceUntil!)}), then auto-stop kicks in`, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" }
    : { icon: ShieldCheck, label: "ON — server auto-stops when no players are online", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };

  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Card className="bg-card/40 border-border backdrop-blur-md flex flex-col rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Automation</span>
          </div>
          <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Auto-Shutdown
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-0 pb-5">
          {/* Current status — big clear indicator */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${statusConfig.border} ${statusConfig.bg}`}>
            <StatusIcon className={`w-5 h-5 ${statusConfig.color} shrink-0`} />
            <span className={`text-sm font-semibold ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/90">
              {effectiveEnabled ? "Auto-shutdown is active" : "Auto-shutdown is off"}
            </span>
            <Switch
              checked={effectiveEnabled}
              onCheckedChange={handleSwitchChange}
            />
          </div>

          {/* Maintenance section */}
          {effectiveEnabled && (
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-border">
              {inMaintenance ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      Server kept alive
                    </span>
                    <span className="text-[11px] text-muted-foreground/70">
                      Won&apos;t auto-stop until {formatTime(autostop.maintenanceUntil!)} — then normal rules apply again
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetMaintenance(0)}
                    className="h-8 text-xs font-semibold shrink-0"
                  >
                    Stop Protecting
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-xs font-medium text-muted-foreground/70">
                    Keep server alive for a while (auto-stop resumes after timer ends)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 4, 8].map((h) => (
                      <Button
                        key={h}
                        variant="outline"
                        size="sm"
                        onClick={() => onSetMaintenance(h)}
                        className="h-8 px-3 text-xs font-semibold"
                      >
                        {h}h
                      </Button>
                    ))}
                    {/* Custom input */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        placeholder="hrs"
                        value={customHours}
                        onChange={(e) => setCustomHours(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleCustomPause(); }}
                        className="w-14 h-8 px-2 text-xs font-semibold rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCustomPause}
                        disabled={!customHours || parseFloat(customHours) <= 0 || parseFloat(customHours) > 24}
                        className="h-8 px-2.5 text-xs font-semibold"
                      >
                        Set
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDisableOpen}
        onOpenChange={setConfirmDisableOpen}
        title="Turn off auto-shutdown?"
        description={
          <>
            The server will keep running (and billing) until you stop it manually.
            If you just need temporary access, use <strong>maintenance pause</strong> instead — it turns back on automatically.
          </>
        }
        confirmLabel="Turn Off"
        cancelLabel="Keep On"
        destructive
        onConfirm={handleConfirmDisable}
      />
    </>
  );
}
