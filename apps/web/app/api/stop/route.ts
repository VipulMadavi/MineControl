import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { loadConfig } from "@minecontrol/config";
import {
  getInstanceStatus,
  stopInstance,
  waitForInstanceStopped,
  stopMinecraft,
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
    return NextResponse.json({ status: "startup_in_progress" });
  }
  if (lock === "stopping") {
    return NextResponse.json({ status: "already_stopping" });
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
    console.error("[STOP] Failed status query:", err.message, err);
    return NextResponse.json({ status: "failed", message: `Failed status check: ${err.message}` });
  }

  // 4. Implement Decision Matrix
  if (ec2Info.state !== "running") {
    console.log("[STOP] EC2 is not running. Already stopped.");
    return NextResponse.json({ status: "already_off" });
  }

  operationLock.set("stopping");
  console.log("[STOP] Stop request received");

  try {
    const stopCmd = 'screen -S mcs -p 0 -X stuff "stop" && screen -S mcs -p 0 -X eval "stuff \\015"';
    if (minecraftInfo.online) {
      // Case A: EC2 Running + Minecraft Online -> Graceful Shutdown
      console.log(`[STOP] Shutdown command sent: "${stopCmd}"`);
      const stopResult = await stopMinecraft(instanceId);

      console.log(`[STOP] SSM command ID: ${stopResult.commandId}`);
      console.log(`[STOP] Command status: ${stopResult.status}`);
      console.log(`[STOP] Command stdout: ${stopResult.stdout}`);
      console.log(`[STOP] Command stderr: ${stopResult.stderr}`);

      console.log("[STOP] Stopping EC2");
      await stopInstance(instanceId);
      await waitForInstanceStopped(instanceId, 300000, 5000);
    } else {
      // Case B: EC2 Running + Minecraft Offline -> Stop EC2 Immediately
      console.log("[STOP] Minecraft offline. Stopping EC2 immediately");
      await stopInstance(instanceId);
      await waitForInstanceStopped(instanceId, 300000, 5000);
    }

    console.log("[STOP] Shutdown complete");
    return NextResponse.json({
      status: "stopped",
      detectedLaunchMethod: "screen",
      implementedShutdownMethod: stopCmd,
      ssmCommandExecuted: stopCmd,
    });
  } catch (error) {
    const err = error as Error;
    console.error("[STOP] Failed to stop server:", err.message, err);
    return NextResponse.json({ status: "failed", message: err.message });
  } finally {
    operationLock.set("idle");
  }
}
