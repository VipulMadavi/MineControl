import * as React from "react";
import { ServerStatus } from "@minecontrol/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Sliders, Play, Square } from "lucide-react";

interface ControlPanelProps {
  status: ServerStatus;
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  operationType?: "starting" | "stopping" | null;
}

export function ControlPanel({
  status,
  onStart,
  onStop,
  onRefresh,
  isRefreshing = false,
  operationType = null,
}: ControlPanelProps) {
  const { ec2, minecraft } = status;

  return (
    <Card className="bg-neutral-900/20 border-neutral-800 backdrop-blur-sm h-full flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center gap-2 text-neutral-400">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wide">Operations</span>
        </div>
        <CardTitle className="text-lg">Server Controls</CardTitle>
        <CardDescription>
          Trigger virtual machine actions and automation controls.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-4">
        {/* Dynamic status helper panel */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-850 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500">Infrastructure state</span>
            <span className="text-sm font-semibold text-neutral-300 capitalize">
              EC2: {ec2.state} | MC: {minecraft.state}
            </span>
          </div>
          <span className="text-xs text-neutral-500 font-mono hidden sm:inline">
            Region: ap-south-1
          </span>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Start Server Button */}
          <Button
            onClick={onStart}
            disabled={ec2.state !== "stopped" || isRefreshing || operationType !== null}
            className="h-11 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all font-semibold gap-2 rounded-lg cursor-pointer"
          >
            {operationType === "starting" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Server
              </>
            )}
          </Button>

          {/* Stop Server Button */}
          <Button
            onClick={onStop}
            disabled={ec2.state !== "running" || minecraft.state !== "online" || isRefreshing || operationType !== null}
            variant="destructive"
            className="h-11 bg-rose-600/90 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all font-semibold gap-2 rounded-lg cursor-pointer"
          >
            {operationType === "stopping" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                Stop Server
              </>
            )}
          </Button>

          {/* Refresh Button */}
          <Button
            onClick={onRefresh}
            disabled={isRefreshing || operationType !== null}
            variant="outline"
            className="h-11 col-span-2 border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-neutral-50 transition-all font-semibold gap-2 rounded-lg cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
