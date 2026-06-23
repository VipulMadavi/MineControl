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

  // 3. Query current status
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
    console.error("[START] Failed pre-flight status check:", err.message, err);
    return NextResponse.json({ status: "failed", message: `Failed pre-flight status check: ${err.message}` });
  }

  // 4. Implement Decision Matrix
  if (ec2Info.state === "running") {
    if (minecraftInfo.online) {
      console.log("[START] Server already running and online.");
      return NextResponse.json({ status: "already_running" });
    }

    // EC2 is running but Minecraft is offline: Trigger recovery flow
    operationLock.set("starting");
    try {
      console.log("[RECOVERY] EC2 already running");
      console.log("[RECOVERY] Minecraft offline");

      console.log("[RECOVERY] Waiting for SSM");
      const ssmWaitSeconds = config.timeouts.ssm_wait_seconds || 60;
      try {
        await waitForSSM(instanceId, ssmWaitSeconds * 1000, 5000);
      } catch (ssmError) {
        const ssmErr = ssmError as Error;
        console.error("[RECOVERY] SSM unavailable:", ssmErr.message);
        return NextResponse.json({ status: "failed", message: "SSM unavailable" });
      }

      console.log("[RECOVERY] Executing start.sh");
      await startMinecraft(instanceId);

      console.log("[START] Waiting for Minecraft");
      const startupWaitSeconds = config.timeouts.startup_wait_seconds || 300;
      await waitForMinecraftOnline(serverAddress, startupWaitSeconds * 1000, 5000);

      console.log("[RECOVERY] Minecraft recovered");
      return NextResponse.json({ status: "minecraft_restarted" });
    } catch (error) {
      const err = error as Error;
      console.error("[RECOVERY] Failed to recover Minecraft:", err.message, err);
      return NextResponse.json({ status: "failed", message: err.message });
    } finally {
      operationLock.set("idle");
    }
  } else {
    // EC2 is off (or not running) -> Run full startup sequence
    operationLock.set("starting");
    try {
      console.log("[START] Starting EC2");
      if (ec2Info.state === "stopped") {
        await startInstance(instanceId);
      }

      console.log("[START] Waiting for instance");
      await waitForInstanceRunning(instanceId, 300000, 5000);

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
}
