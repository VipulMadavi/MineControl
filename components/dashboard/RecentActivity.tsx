"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Play, Square, RefreshCw, AlertTriangle } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { ActivityItem } from "@/hooks/useActivityLog";

interface RecentActivityProps {
  activity: ActivityItem[];
  onClear?: () => void;
}

/** Visual mapping for an activity entry, derived from its kind + status. */
function getVisual(item: ActivityItem) {
  if (item.status === "error") {
    return {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    };
  }
  switch (item.kind) {
    case "start":
      return {
        icon: <Play className="w-3.5 h-3.5 text-emerald-500" />,
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    case "stop":
      return {
        icon: <Square className="w-3.5 h-3.5 text-rose-500" />,
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
      };
    default:
      return {
        icon: <RefreshCw className="w-3.5 h-3.5 text-blue-500" />,
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };
  }
}

export function RecentActivity({ activity, onClear }: RecentActivityProps) {
  return (
    <Card className="bg-card/40 border-border backdrop-blur-md h-full flex flex-col rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Log Stream</span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">Recent Activity</CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80 font-normal leading-relaxed">
          Server operations performed from this device.
        </CardDescription>
        {activity.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="mt-2 self-start px-2.5 py-1 text-[10px] font-semibold rounded-md border border-border bg-muted/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all cursor-pointer"
          >
            Clear log
          </button>
        )}
      </CardHeader>

      <CardContent className="mt-2 pb-6 flex-1">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="p-2.5 rounded-full bg-muted border border-border text-muted-foreground/60">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground/70 font-medium">No activity yet</p>
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed max-w-[16rem]">
              Start or stop the server and the actions will appear here.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-border flex flex-col gap-6">
            {activity.map((item) => {
              const visual = getVisual(item);
              return (
                <div key={item.id} className="relative flex flex-col gap-1">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full border ${visual.border} ${visual.bg} flex items-center justify-center`}>
                    {visual.icon}
                  </span>

                  <span className="text-xs font-semibold text-foreground/90 leading-snug">{item.message}</span>
                  <span className="text-[10px] text-muted-foreground/60 leading-none">
                    {formatRelativeTime(item.at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
