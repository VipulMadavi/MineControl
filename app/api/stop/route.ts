import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { requireEnv } from "@/lib/env";
import {
  getInstanceStatus,
  stopInstance,
  waitForInstanceStopped,
  stopMinecraft,
  getMinecraftInfo
} from "@/lib/aws";
import { operationLock } from "@/lib/operation-lock";
import {
  logStopRequested,
  logStopSuccess,
  logStopFailed,
  logAwsError,
} from "@/lib/discord/webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  // 1. Session authorization
  const session = await auth();
  if (!session || !session.user?.isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Concurrency lock
  const lock = operationLock.get();
  if (lock === "starting") {
    return NextResponse.json({ success: false, status: "startup_in_progress", message: "Cannot stop: startup is in progress." });
  }
  if (lock === "stopping") {
    return NextResponse.json({ success: false, status: "already_stopping", message: "Server shutdown is already in progress." });
  }

  let instanceId: string;
  try {
    instanceId = requireEnv("INSTANCE_ID");
  } catch (e) {
    const err = e as Error;
    console.error("[api/stop]", err.message);
    return NextResponse.json({ success: false, error: "Server configuration error." }, { status: 500 });
  }

  const config = loadConfig();
  const serverAddress = config.minecraft.server_address;
  const username = session.user?.name || session.user?.email || "Unknown User";

  // 3. Pre-stop status check
  let ec2Info;
  let minecraftInfo;
  try {
    const statusResult = await Promise.all([
      getInstanceStatus(instanceId),
      getMinecraftInfo(serverAddress, 2500),
    ]);
    ec2Info = statusResult[0];
    minecraftInfo = statusResult[1];
  } catch (error) {
    const err = error as Error;
    console.error("[api/stop] Pre-stop status check failed:", err.message);
    logAwsError("Pre-stop status query", err.message);
    return NextResponse.json({ success: false, error: "Failed to query AWS instance status." }, { status: 503 });
  }

  if (ec2Info.state !== "running") {
    return NextResponse.json({ success: true, status: "already_off", message: "Server is already stopped." });
  }

  operationLock.set("stopping");
  console.log("[api/stop] Stop requested by:", username);
  logStopRequested(username);

  try {
    if (minecraftInfo.online) {
      // Graceful shutdown
      console.log("[api/stop] Minecraft online — graceful shutdown");
      const stopResult = await stopMinecraft(instanceId);
      console.log(`[api/stop] SSM command: ${stopResult.commandId} — ${stopResult.status}`);
    } else {
      console.log("[api/stop] Minecraft offline — stopping EC2 directly");
    }

    await stopInstance(instanceId);
    await waitForInstanceStopped(instanceId, 300000, 5000);

    console.log("[api/stop] Shutdown complete");
    logStopSuccess();
    return NextResponse.json({
      success: true,
      status: "stopped",
      message: "Server stopped successfully.",
    });
  } catch (error) {
    const err = error as Error;
    console.error("[api/stop] Shutdown failed:", err.message);
    logStopFailed(err.message);
    return NextResponse.json({ success: false, status: "failed", error: "Failed to stop server." }, { status: 500 });
  } finally {
    operationLock.set("idle");
  }
}
