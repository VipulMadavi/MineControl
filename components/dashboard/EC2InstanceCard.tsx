"use client";

import * as React from "react";
import { ServerStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, Cpu, Globe, Key, Activity, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EC2InstanceCardProps {
  status: ServerStatus;
}

export function EC2InstanceCard({ status }: EC2InstanceCardProps) {
  const { ec2, minecraft } = status;

  const getEc2Badge = () => {
    switch (ec2.state) {
      case "running":
        return <Badge className="bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 font-medium capitalize">Running</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 font-medium animate-pulse capitalize">Pending</Badge>;
      case "stopping":
        return <Badge className="bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20 font-medium animate-pulse capitalize">Stopping</Badge>;
      default:
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 font-medium capitalize">Stopped</Badge>;
    }
  };

  const isRunning = ec2.state === "running";

  return (
    <Card className="bg-card/40 border-border backdrop-blur-md transition-all duration-300 group rounded-xl w-full">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Database className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider">AWS Cloud Infrastructure</span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">EC2 Virtual Machine</CardTitle>
        <CardDescription className="text-xs text-muted-foreground/80 font-normal leading-relaxed">
          Monitor and manage virtual resources hosting the game server loop.
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-5 sm:pb-6 flex flex-col gap-4 sm:gap-6">
        {/* Connection pipeline — stack on mobile, row on md+ */}
        <div className="p-3 sm:p-4 rounded-xl bg-neutral-100/50 dark:bg-neutral-950/40 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* EC2 node */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${isRunning ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" : "bg-neutral-500/10 text-neutral-400"}`}>
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-none">Virtual Machine Instance</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-mono truncate">{status.ec2.state === "running" ? "Connected" : "Disconnected"}</p>
            </div>
          </div>

          {/* Connection link — hidden on mobile, shown on md+ */}
          <div className="flex-1 hidden md:flex items-center justify-center min-w-[100px] max-w-xs px-4">
            <div className="w-full flex items-center relative">
              <div className="w-full h-[2px] bg-border relative">
                {isRunning && (
                  <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-emerald-500 to-transparent animate-shimmer" />
                )}
              </div>
              <span className={`absolute left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                isRunning
                  ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-neutral-100 dark:bg-neutral-900 text-muted-foreground/60 border-border"
              }`}>
                {isRunning ? "SSM Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* SSM badge on mobile */}
          <div className="md:hidden">
            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border ${
              isRunning
                ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20"
                : "bg-neutral-100 dark:bg-neutral-900 text-muted-foreground/60 border-border"
            }`}>
              {isRunning ? "SSM Online" : "Offline"}
            </span>
          </div>

          {/* Minecraft node */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${minecraft.state === "online" ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" : "bg-neutral-500/10 text-neutral-400"}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-none">Minecraft Server Application</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-mono">MC Port</p>
            </div>
          </div>
        </div>

        {/* Metadata grid — 2 col on mobile, 3 on sm, 6 on lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {/* Instance State */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">Instance State</span>
            <div className="flex items-center gap-1.5 h-6">
              {getEc2Badge()}
            </div>
          </div>

          {/* Region */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">Region</span>
            <div className="flex items-center gap-1.5 h-6 text-sm font-semibold text-foreground/80">
              <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="truncate">ap-south-1</span>
            </div>
          </div>

          {/* Instance Type */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">Instance Type</span>
            <div className="flex items-center gap-1.5 h-6 text-sm font-semibold text-foreground/80">
              <Cpu className="w-4 h-4 text-neutral-400 shrink-0" />
              t3.medium
            </div>
          </div>

          {/* Status Checks */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">Status Checks</span>
            <div className="flex items-center gap-1.5 h-6 text-sm font-semibold text-foreground/80">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${isRunning ? "text-emerald-500" : "text-neutral-400"}`} />
              {isRunning ? "2/2 passed" : "—"}
            </div>
          </div>

          {/* SSH Key Pair */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">SSH Key Pair</span>
            <div className="flex items-center gap-1.5 h-6 text-sm font-semibold text-foreground/80">
              <Key className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="truncate">minecontrol</span>
            </div>
          </div>

          {/* Virtualization */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">Virtualization</span>
            <div className="flex items-center gap-1.5 h-6 text-sm font-semibold text-foreground/80">
              <Activity className="w-4 h-4 text-neutral-400 shrink-0" />
              xen / hvm
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
