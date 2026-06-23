import * as React from "react";
import { ServerStatus } from "@minecontrol/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OverviewPanelProps {
  status: ServerStatus;
}

export function OverviewPanel({ status }: OverviewPanelProps) {
  const { ec2, minecraft } = status;

  return (
    <Card className="bg-neutral-900/20 border-neutral-800 backdrop-blur-sm h-full flex flex-col justify-between">
      <div>
        <CardHeader>
          <div className="flex items-center gap-2 text-neutral-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wide">Infrastructure</span>
          </div>
          <CardTitle className="text-lg">Status Overview</CardTitle>
          <CardDescription>
            High-level configuration status values mapping.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 text-sm mt-2">
          {/* EC2 Instance State */}
          <div className="flex justify-between items-center py-2.5 border-b border-neutral-850">
            <span className="text-neutral-400 font-medium">EC2 Instance</span>
            <Badge
              className={`capitalize border ${
                ec2.state === "running"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : ec2.state === "pending"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {ec2.state}
            </Badge>
          </div>

          {/* Minecraft Server State */}
          <div className="flex justify-between items-center py-2.5">
            <span className="text-neutral-400 font-medium">Minecraft Server</span>
            <Badge
              className={`capitalize border ${
                minecraft.state === "online"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : minecraft.state === "starting"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {minecraft.state}
            </Badge>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
