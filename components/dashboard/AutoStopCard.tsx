"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Timer, ShieldCheck, ShieldOff } from "lucide-react";
import type { AutostopStatus } from "@/types";

interface AutoStopCardProps {
  autostop: AutostopStatus;
  onToggle: () => void;
}

export function AutoStopCard({ autostop, onToggle }: AutoStopCardProps) {
  const [confirmDisableOpen, setConfirmDisableOpen] = React.useState(false);
  const [optimisticEnabled, setOptimisticEnabled] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setOptimisticEnabled(null);
  }, [autostop.enabled]);

  const effectiveEnabled = optimisticEnabled ?? autostop.enabled;

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
          {/* Status banner */}
          {effectiveEnabled ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                <span className="text-[11px] text-muted-foreground/70">
                  Server auto-stops after 15 min with no players
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10">
              <ShieldOff className="w-5 h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-rose-500">Off</span>
                <span className="text-[11px] text-muted-foreground/70">
                  Server runs until you stop it manually
                </span>
              </div>
            </div>
          )}

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/90">
              Auto-shutdown
            </span>
            <Switch
              checked={effectiveEnabled}
              onCheckedChange={handleSwitchChange}
            />
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDisableOpen}
        onOpenChange={setConfirmDisableOpen}
        title="Turn off auto-shutdown?"
        description="The server will keep running (and billing) until you manually stop it."
        confirmLabel="Turn Off"
        cancelLabel="Keep On"
        destructive
        onConfirm={handleConfirmDisable}
      />
    </>
  );
}
