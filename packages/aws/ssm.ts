import {
  SendCommandCommand,
  DescribeInstanceInformationCommand,
  GetCommandInvocationCommand
} from "@aws-sdk/client-ssm";
import { getSSMClient } from "./clients";
import { AWSOperationError } from "./errors";

// Send shell command to instance via SSM RunShellScript
export async function runCommand(instanceId: string, command: string): Promise<string> {
  const client = getSSMClient();
  try {
    const response = await client.send(
      new SendCommandCommand({
        InstanceIds: [instanceId],
        DocumentName: "AWS-RunShellScript",
        Parameters: {
          commands: [command],
        },
      })
    );
    const commandId = response.Command?.CommandId;
    if (!commandId) {
      throw new Error("No CommandID returned from SSM SendCommand execution.");
    }
    return commandId;
  } catch (error: any) {
    throw new AWSOperationError(`Failed executing SSM command on ${instanceId}: ${error.message}`, error);
  }
}

// Execute command and poll for execution status and outputs
export async function runCommandWithOutput(
  instanceId: string,
  command: string,
  timeoutMs: number = 30000
): Promise<{ commandId: string; status: string; stdout: string; stderr: string }> {
  const client = getSSMClient();
  try {
    const response = await client.send(
      new SendCommandCommand({
        InstanceIds: [instanceId],
        DocumentName: "AWS-RunShellScript",
        Parameters: {
          commands: [command],
        },
      })
    );
    const commandId = response.Command?.CommandId;
    if (!commandId) {
      throw new Error("No CommandID returned from SSM SendCommand execution.");
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const invocation = await client.send(
          new GetCommandInvocationCommand({
            CommandId: commandId,
            InstanceId: instanceId,
          })
        );
        const status = invocation.Status || "";
        if (["Success", "Failed", "Cancelled", "TimedOut"].includes(status)) {
          return {
            commandId,
            status,
            stdout: invocation.StandardOutputContent || "",
            stderr: invocation.StandardErrorContent || "",
          };
        }
      } catch (error: any) {
        if (!error.message?.includes("InvocationDoesNotExist")) {
          console.warn(`[ssm] Error getting command invocation: ${error.message}`);
        }
      }
    }
    throw new Error(`Command ${commandId} timed out after ${timeoutMs}ms.`);
  } catch (error: any) {
    throw new AWSOperationError(`Failed executing SSM command with output on ${instanceId}: ${error.message}`, error);
  }
}

// Start Minecraft Server process
export async function startMinecraft(instanceId: string): Promise<string> {
  return runCommand(instanceId, "cd /home/ubuntu/minecraft && ./start.sh");
}

// Stop Minecraft Server process with screen command and polling exit verification
export async function stopMinecraft(
  instanceId: string
): Promise<{ commandId: string; status: string; stdout: string; stderr: string }> {
  const stopCmd = 'screen -S mcs -p 0 -X stuff "stop" && screen -S mcs -p 0 -X eval "stuff \\015"';
  console.log(`[STOP] Sending screen stop command: "${stopCmd}"`);
  
  const result = await runCommandWithOutput(instanceId, stopCmd);
  console.log(`[STOP] Shutdown command sent. CommandID: ${result.commandId}, Status: ${result.status}`);
  
  // Verify process exit
  console.log("[STOP] Verifying Minecraft process exits...");
  let exited = false;
  // Poll for up to 60 seconds (12 attempts, 5s delay)
  for (let attempt = 1; attempt <= 12; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      const psResult = await runCommandWithOutput(instanceId, "ps aux | grep java", 10000);
      if (!psResult.stdout.includes("server.jar")) {
        console.log("[STOP] Verification SUCCESS: Minecraft process has exited.");
        exited = true;
        break;
      }
      console.log(`[STOP] Verification attempt ${attempt}/12: Minecraft process still running.`);
    } catch (e: any) {
      console.warn(`[STOP] Verification attempt ${attempt}/12 failed to query process: ${e.message}`);
    }
  }

  if (!exited) {
    throw new AWSOperationError("Minecraft process did not exit within 60 seconds.");
  }

  return result;
}

// Wait for SSM agent on instance to be online
export async function waitForSSM(
  instanceId: string,
  timeoutMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<void> {
  const client = getSSMClient();
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await client.send(new DescribeInstanceInformationCommand({}));
      const instance = response.InstanceInformationList?.find(
        (info) => info.InstanceId === instanceId
      );
      if (instance && instance.PingStatus === "Online") {
        return;
      }
    } catch (error: any) {
      console.warn(`[ssm] Error checking instance information status: ${error.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new AWSOperationError(`Timed out waiting for SSM agent on ${instanceId} to be online.`);
}
