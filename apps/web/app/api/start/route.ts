import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { loadConfig } from "@minecontrol/config";
import {
  getInstanceStatus,
  startInstance,
  waitForInstanceRunning,
  waitForSSM,
  startMinecraft,
  waitForMinecraftOnline,
  getMinecraftInfo
} from "@minecontrol/aws";
import { operationLock } from "@/lib/operation-lock";

export const dynamic = "force-dynamic";

export async function POST() {
  // 1. Session authorization verify
  const session = await auth();
  if (!session || !session.user?.isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Concurrency operation lock check
  const lock = operationLock.get();
  if (lock === "starting") {
    return NextResponse.json({ status: "already_starting" });
  }
  if (lock === "stopping") {
    return NextResponse.json({ status: "shutdown_in_progress" });
  }

  const rawInstanceId = process.env.INSTANCE_ID || "";
  const instanceId = rawInstanceId.replace(/^['"]|['"]$/g, "");
  if (!instanceId) {
    return NextResponse.json({ status: "failed", message: "INSTANCE_ID environment variable is missing" });
  }

  const config = loadConfig();
  const serverAddress = config.minecraft.server_address;

  // 3. Pre-flight check: already running & online
  try {
    const [ec2Info, minecraftInfo] = await Promise.all([
      getInstanceStatus(instanceId),
      getMinecraftInfo(serverAddress, 2500),
    ]);

    if (ec2Info.state === "running" && minecraftInfo.online) {
      return NextResponse.json({ status: "already_running" });
    }
  } catch (err) {
    console.warn("[START] Pre-flight status query warning:", err);
  }

  // 4. Set start lock and execute workflow
  operationLock.set("starting");

  try {
    console.log("[START] Starting EC2");
    const ec2Status = await getInstanceStatus(instanceId);
    
    if (ec2Status.state === "stopped") {
      await startInstance(instanceId);
    }

    if (ec2Status.state !== "running") {
      console.log("[START] Waiting for instance");
      await waitForInstanceRunning(instanceId, 300000, 5000);
    }

    console.log("[START] Waiting for SSM");
    const ssmWaitSeconds = config.timeouts.ssm_wait_seconds || 60;
    await waitForSSM(instanceId, ssmWaitSeconds * 1000, 5000);

    console.log("[START] Executing start.sh");
    await startMinecraft(instanceId);

    console.log("[START] Waiting for Minecraft");
    const startupWaitSeconds = config.timeouts.startup_wait_seconds || 300;
    await waitForMinecraftOnline(serverAddress, startupWaitSeconds * 1000, 5000);

    console.log("[START] Startup complete");
    return NextResponse.json({ status: "online" });
  } catch (error) {
    const err = error as Error;
    console.error("[START] Failed to start server:", err.message, err);
    return NextResponse.json({ status: "failed", message: err.message });
  } finally {
    operationLock.set("idle");
  }
}
