"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog } from "@base-ui/react/dialog";
import { Activity, Play, Square, RefreshCw, AlertTriangle, Expand, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/hooks/useActivityLog";

interface RecentActivityProps {
  activity: ActivityItem[];
  onClear?: () => void;
}

const MAX_VISIBLE = 5;

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

function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <div className="relative pl-6 border-l border-border flex flex-col gap-6">
      {items.map((item) => {
        const visual = getVisual(item);
        return (
          <div key={item.id} className="relative flex flex-col gap-1">
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
  );
}

export function RecentActivity({ activity, onClear }: RecentActivityProps) {
  const [expanded, setExpanded] = React.useState(false);
  const visibleItems = activity.slice(0, MAX_VISIBLE);
  const hasMore = activity.length > MAX_VISIBLE;

  return (
    <>
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
          {activity.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {onClear && (
                <button
                  onClick={onClear}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-md border border-border bg-muted/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all cursor-pointer"
                >
                  Clear log
                </button>
              )}
              {hasMore && (
                <button
                  onClick={() => setExpanded(true)}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-md border border-border bg-muted/60 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-foreground/20 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Expand className="w-3 h-3" />
                  View All ({activity.length})
                </button>
              )}
            </div>
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
            <ActivityTimeline items={visibleItems} />
          )}
        </CardContent>
      </Card>

      {/* Expanded log dialog */}
      <Dialog.Root open={expanded} onOpenChange={setExpanded}>
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn(
              "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
              "transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
            )}
          />
          <Dialog.Popup
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg max-h-[80vh] -translate-x-1/2 -translate-y-1/2",
              "rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl outline-none",
              "flex flex-col gap-4 transition-all duration-200",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <Dialog.Title className="text-base font-semibold text-foreground">
                  Activity Log ({activity.length})
                </Dialog.Title>
              </div>
              <Dialog.Close className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-xs text-muted-foreground/70">
              All operations performed from this device (stored locally, max 20).
            </Dialog.Description>

            {/* Scrollable log */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1">
              <ActivityTimeline items={activity} />
            </div>

            {/* Footer actions */}
            {onClear && (
              <div className="pt-3 border-t border-border/50 flex justify-end">
                <button
                  onClick={() => {
                    onClear();
                    setExpanded(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-muted/60 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
