import * as React from "react";
import { ServerStatus } from "@minecontrol/types";
import { StatusCard } from "./StatusCard";
import {
  Server,
  Users,
  Activity,
  Clock,
  Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardGridProps {
  status: ServerStatus;
}

export function DashboardGrid({ status }: DashboardGridProps) {
  const { ec2, minecraft } = status;

  // Helper to determine Minecraft state badge color and classes
  const getMinecraftBadge = () => {
    switch (minecraft.state) {
      case "online":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)] capitalize">Online</Badge>;
      case "starting":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)] animate-pulse capitalize">Starting</Badge>;
      case "stopping":
        return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)] animate-pulse capitalize">Stopping</Badge>;
      default:
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)] capitalize">Offline</Badge>;
    }
  };

  // Helper to determine Minecraft status indicator dot color
  const getMinecraftIndicator = () => {
    switch (minecraft.state) {
      case "online":
        return "text-emerald-500 bg-emerald-500";
      case "starting":
      case "stopping":
        return "text-amber-500 bg-amber-500";
      default:
        return "text-rose-500 bg-rose-500";
    }
  };

  // Helper for EC2 state badge
  const getEc2Badge = () => {
    switch (ec2.state) {
      case "running":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)] capitalize">Running</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)] animate-pulse capitalize">Pending</Badge>;
      case "stopping":
        return <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)] animate-pulse capitalize">Stopping</Badge>;
      default:
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)] capitalize">Stopped</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Card 1: Server Status */}
      <StatusCard
        title="Server Status"
        value={minecraft.state}
        description="Current game server loop state"
        icon={<Server className="w-5 h-5 text-emerald-400" />}
        badge={getMinecraftBadge()}
        indicatorColor={getMinecraftIndicator()}
      />

      {/* Card 2: Players */}
      <StatusCard
        title="Players"
        value={minecraft.state === "online" ? `${minecraft.players} / ${minecraft.maxPlayers}` : "0 / --"}
        description={minecraft.state === "online" && minecraft.players > 0 ? "Steve, Alex, Notch" : "No players online"}
        icon={<Users className="w-5 h-5 text-blue-400" />}
      />

      {/* Card 3: Ping */}
      <StatusCard
        title="Ping"
        value={minecraft.state === "online" && minecraft.latency ? `${minecraft.latency} ms` : "N/A"}
        description={minecraft.state === "online" ? "Latency connection stable" : "Server offline"}
        icon={<Activity className="w-5 h-5 text-indigo-400" />}
      />

      {/* Card 4: Uptime */}
      <StatusCard
        title="Uptime"
        value={minecraft.state === "online" ? ec2.uptime : "00h 00m 00s"}
        description={minecraft.state === "online" ? "Continuous game server loop" : "Instance stopped"}
        icon={<Clock className="w-5 h-5 text-amber-400" />}
      />

      {/* Card 5: EC2 */}
      <StatusCard
        title="EC2 Instance"
        value={ec2.state}
        description="Underlying AWS virtual machine"
        icon={<Database className="w-5 h-5 text-cyan-400" />}
        badge={getEc2Badge()}
      />

    </div>
  );
}
