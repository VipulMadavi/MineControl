"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

function formatMaintenanceTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getTimeRemaining(iso: string): string {
  const diff = Date.parse(iso) - Date.now();
  if (diff <= 0) return "expiring...";
  const mins = Math.ceil(diff / 60_000);
  if (mins < 60) return `${mins}m remaining`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m remaining`;
}

export function AutoStopCard({ autostop, onToggle, onSetMaintenance }: AutoStopCardProps) {
  const [confirmDisableOpen, setConfirmDisableOpen] = React.useState(false);

  const inMaintenance = !!autostop.maintenanceUntil &&
    Date.now() < Date.parse(autostop.maintenanceUntil);

  const handleSwitchChange = (checked: boolean) => {
    if (!checked) {
      // Disabling — confirm first
      setConfirmDisableOpen(true);
    } else {
      onToggle();
    }
  };

  return (
    <>
      <Card className="bg-card/40 border-border backdrop-blur-md flex flex-col rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Automation</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
              Auto-Stop
            </CardTitle>
            {/* Status badge */}
            {!autostop.enabled ? (
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-500 text-[10px] font-semibold gap-1">
                <ShieldOff className="w-3 h-3" />
                Disabled
              </Badge>
            ) : inMaintenance ? (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold gap-1">
                <Wrench className="w-3 h-3" />
                Paused until {formatMaintenanceTime(autostop.maintenanceUntil!)}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold gap-1">
                <ShieldCheck className="w-3 h-3" />
                Enabled
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs text-muted-foreground/80 font-normal leading-relaxed">
            Automatically stops the server when idle. Disable or pause temporarily for maintenance.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-2 pb-5">
          {/* Toggle row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground/90">Auto-stop idle shutdown</span>
              <span className="text-[10px] text-muted-foreground/60">
                Server stops after idle timeout when enabled
              </span>
            </div>
            <Switch
              checked={autostop.enabled}
              onCheckedChange={handleSwitchChange}
            />
          </div>

          {/* Maintenance section — only when enabled */}
          {autostop.enabled && (
            <div className="flex flex-col gap-3 p-3 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-border">
              {inMaintenance ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        Maintenance Active
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {getTimeRemaining(autostop.maintenanceUntil!)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSetMaintenance(0)}
                      className="h-8 text-xs font-semibold"
                    >
                      Resume Now
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    Pause for maintenance
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 4].map((h) => (
                      <Button
                        key={h}
                        variant="outline"
                        size="sm"
                        onClick={() => onSetMaintenance(h)}
                        className="h-8 text-xs font-semibold"
                      >
                        {h}h
                      </Button>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 leading-relaxed">
                    Auto-stop pauses temporarily and resumes automatically after the window expires.
                  </span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDisableOpen}
        onOpenChange={setConfirmDisableOpen}
        title="Disable auto-stop?"
        description={
          <>
            The server will keep running until you stop it manually. This can lead to
            unexpected AWS charges if forgotten.{" "}
            <strong>Prefer a maintenance pause</strong> — it auto-expires so you can&apos;t forget.
          </>
        }
        confirmLabel="Disable Auto-Stop"
        cancelLabel="Cancel"
        destructive
        onConfirm={onToggle}
      />
    </>
  );
}
