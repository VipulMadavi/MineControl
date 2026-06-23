import {
  SendCommandCommand,
  DescribeInstanceInformationCommand
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

// Start Minecraft Server process
export async function startMinecraft(instanceId: string): Promise<string> {
  return runCommand(instanceId, "cd /home/ubuntu/minecraft && ./start.sh");
}

// Stop Minecraft Server process
export async function stopMinecraft(instanceId: string): Promise<string> {
  return runCommand(instanceId, "stop");
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
