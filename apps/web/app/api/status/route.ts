import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { loadConfig } from "@minecontrol/config";
import {
  getInstanceStatus,
  getMinecraftInfo,
  stopInstance
} from "@minecontrol/aws";
import { ServerStatusSchema } from "@minecontrol/types";
import { formatUptime } from "@/lib/format-uptime";
import { operationLock } from "@/lib/operation-lock";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. Session authorization verify
  const session = await auth();
  if (!session || !session.user?.isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Read parameters
    const rawInstanceId = process.env.INSTANCE_ID || "";
    const instanceId = rawInstanceId.replace(/^['"]|['"]$/g, "");
    if (!instanceId) {
      throw new Error("INSTANCE_ID environment variable is missing.");
    }

    const config = loadConfig();
    const serverAddress = config.minecraft.server_address;

    // 3. Parallel fetching of status metrics
    const [ec2Info, minecraftInfo] = await Promise.all([
      getInstanceStatus(instanceId),
      getMinecraftInfo(serverAddress, 4000),
    ]);

    const lock = operationLock.get();
    const isRecoveryState = ec2Info.state === "running" && !minecraftInfo.online && lock === "idle";

    // 4. Recovery State Tick Logic & Auto-Shutdown Trigger
    if (isRecoveryState) {
      console.log("[RECOVERY] Minecraft offline detected");
      const ticks = operationLock.incrementRecoveryTicks();
      console.log(`[RECOVERY] Recovery tick: ${ticks}/2`);

      if (ticks >= 2) {
        console.log("[RECOVERY] Threshold reached");
        console.log("[RECOVERY] Stopping EC2");
        
        // Trigger EC2 stop asynchronously to prevent status call timeout
        stopInstance(instanceId)
          .then(() => {
            console.log("[RECOVERY] Stop command successfully sent to EC2");
          })
          .catch((err) => {
            console.error("[RECOVERY] Failed to stop EC2:", err.message);
          });

        operationLock.resetRecoveryTicks();
      }
    } else {
      // Reset tick counter if not in recovery state conditions
      if (minecraftInfo.online || ec2Info.state !== "running" || lock !== "idle") {
        operationLock.resetRecoveryTicks();
      }
    }

    // 5. Compute formatted uptime and map status object
    const uptime = ec2Info.state === "running" ? formatUptime(ec2Info.launchTime) : "0m";

    // Map minecraft status state via matrix
    let minecraftState: "online" | "offline" | "starting" | "stopping" | "recovery" = "offline";
    if (lock === "starting") {
      minecraftState = "starting";
    } else if (lock === "stopping") {
      minecraftState = "stopping";
    } else if (ec2Info.state === "running") {
      if (minecraftInfo.online) {
        minecraftState = "online";
      } else {
        minecraftState = "recovery";
      }
    } else {
      minecraftState = "offline";
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
    };

    // 6. Strict schema validation
    const validated = ServerStatusSchema.parse(statusData);

    return NextResponse.json(validated);
  } catch (error) {
    const err = error as Error;
    console.error("[api/status] Error retrieving status metrics:", err.message, err);
    return NextResponse.json(
      { error: "Failed to retrieve status" },
      { status: 500 }
    );
  }
}

