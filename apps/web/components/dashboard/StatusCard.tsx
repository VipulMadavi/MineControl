import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  indicatorColor?: string; // e.g. "bg-emerald-500", "bg-rose-500", "bg-amber-500"
}

export function StatusCard({
  title,
  value,
  description,
  icon,
  badge,
  indicatorColor,
}: StatusCardProps) {
  return (
    <Card className="bg-neutral-900/30 border-neutral-800 backdrop-blur-sm hover:border-neutral-700 transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
          {title}
        </span>
        <div className="group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {indicatorColor && (
              <span
                className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${indicatorColor}`}
              />
            )}
            <span className="text-2xl font-bold tracking-tight text-neutral-50 truncate">
              {value}
            </span>
            {badge && <div className="ml-1.5">{badge}</div>}
          </div>
          <span className="text-xs text-neutral-500 font-medium truncate">
            {description}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
