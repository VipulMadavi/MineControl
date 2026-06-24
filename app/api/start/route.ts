import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { requireEnv, optionalEnv } from "@/lib/env";
import {
  getInstanceStatus,
  startInstance,
  waitForInstanceRunning,
  waitForSSM,
  startMinecraft,
  waitForMinecraftOnline,
  getMinecraftInfo
} from "@/lib/aws";
import { operationLock } from "@/lib/operation-lock";
import {
  logStartRequested,
  logStartSuccess,
  logStartFailed,
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
    return NextResponse.json({ success: false, status: "already_starting", message: "Server startup is already in progress." });
  }
  if (lock === "stopping") {
    return NextResponse.json({ success: false, status: "shutdown_in_progress", message: "Cannot start: shutdown is in progress." });
  }

  let instanceId: string;
  try {
    instanceId = requireEnv("INSTANCE_ID");
  } catch (e) {
    const err = e as Error;
    console.error("[api/start]", err.message);
    return NextResponse.json({ success: false, error: "Server configuration error." }, { status: 500 });
  }

  const region = optionalEnv("AWS_REGION", "ap-south-1");
  const config = loadConfig();
  const serverAddress = config.minecraft.server_address;
  const username = session.user?.name || session.user?.email || "Unknown User";

  // 3. Pre-flight status check
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
    console.error("[api/start] Pre-flight check failed:", err.message);
    logAwsError("Pre-flight status check", err.message);
    return NextResponse.json({ success: false, error: "Failed to query AWS instance status." }, { status: 503 });
  }

  // 4. Decision matrix
  if (ec2Info.state === "running") {
    if (minecraftInfo.online) {
      return NextResponse.json({ success: true, status: "already_running", message: "Server is already running." });
    }

    // EC2 running but Minecraft offline: recovery flow
    operationLock.set("starting");
    logStartRequested(username, instanceId, region);
    try {
      const ssmWaitSeconds = config.timeouts.ssm_wait_seconds || 60;
      await waitForSSM(instanceId, ssmWaitSeconds * 1000, 5000);
      await startMinecraft(instanceId);

      const startupWaitSeconds = config.timeouts.startup_wait_seconds || 300;
      await waitForMinecraftOnline(serverAddress, startupWaitSeconds * 1000, 5000);

      logStartSuccess("running", "online");
      return NextResponse.json({ success: true, status: "minecraft_restarted", message: "Minecraft server restarted successfully." });
    } catch (error) {
      const err = error as Error;
      console.error("[api/start] Recovery failed:", err.message);
      logStartFailed(err.message);
      return NextResponse.json({ success: false, status: "failed", error: "Failed to recover Minecraft server." }, { status: 500 });
    } finally {
      operationLock.set("idle");
    }
  }

  // EC2 is stopped: full startup sequence
  operationLock.set("starting");
  logStartRequested(username, instanceId, region);
  try {
    if (ec2Info.state === "stopped") {
      await startInstance(instanceId);
    }
    await waitForInstanceRunning(instanceId, 300000, 5000);

    const ssmWaitSeconds = config.timeouts.ssm_wait_seconds || 60;
    await waitForSSM(instanceId, ssmWaitSeconds * 1000, 5000);
    await startMinecraft(instanceId);

    const startupWaitSeconds = config.timeouts.startup_wait_seconds || 300;
    await waitForMinecraftOnline(serverAddress, startupWaitSeconds * 1000, 5000);

    logStartSuccess("running", "online");
    return NextResponse.json({ success: true, status: "online", message: "Server started successfully." });
  } catch (error) {
    const err = error as Error;
    console.error("[api/start] Startup failed:", err.message);
    logStartFailed(err.message);
    return NextResponse.json({ success: false, status: "failed", error: "Failed to start server." }, { status: 500 });
  } finally {
    operationLock.set("idle");
  }
}
