import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { AUTH_BYPASS, MOCK_SESSION } from "@/lib/auth-bypass";
import { loadConfig } from "@/lib/config";
import { requireEnv } from "@/lib/env";
import {
  getInstanceStatus,
  getMinecraftInfo,
  getAutostopState,
} from "@/lib/aws";
import { ServerStatusSchema } from "@/types";
import { formatUptime } from "@/lib/format-uptime";
import { operationLock } from "@/lib/operation-lock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // 1. Session authorization
  const session = AUTH_BYPASS ? MOCK_SESSION : await auth();
  if (!session || !session.user?.isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const instanceId = requireEnv("INSTANCE_ID");
    const config = loadConfig();
    const serverAddress = config.minecraft.server_address;

    // 2. Parallel status queries
    const [ec2Info, minecraftInfo] = await Promise.all([
      getInstanceStatus(instanceId),
      getMinecraftInfo(serverAddress, 4000),
    ]);

    // 3. Compute uptime and state
    const uptime = ec2Info.state === "running" ? formatUptime(ec2Info.launchTime) : "0m";

    const lock = operationLock.get();
    let minecraftState: "online" | "offline" | "starting" | "stopping" = "offline";
    if (lock === "starting") {
      minecraftState = "starting";
    } else if (lock === "stopping") {
      minecraftState = "stopping";
    } else {
      minecraftState = minecraftInfo.online ? "online" : "offline";
    }

    // 4. Autostop state (isolated — never breaks status)
    let autostop = { enabled: false, maintenanceUntil: null as string | null, active: false };
    try {
      const state = await getAutostopState();
      autostop = { enabled: state.enabled, maintenanceUntil: state.maintenanceUntil, active: state.active };
    } catch (e) {
      console.error("[api/status] Autostop read failed:", (e as Error).message);
    }

    const statusData = {
      ec2: {
        state: ec2Info.state,
        uptime,
      },
      minecraft: {
        state: minecraftState,
        players: minecraftInfo.players,
        maxPlayers: minecraftInfo.maxPlayers,
        latency: minecraftInfo.latency,
      },
      autostop,
    };

    const validated = ServerStatusSchema.parse(statusData);
    return NextResponse.json(validated);
  } catch (error) {
    const err = error as Error;
    console.error("[api/status] Error:", err.message);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve server status" },
      { status: 500 }
    );
  }
}
