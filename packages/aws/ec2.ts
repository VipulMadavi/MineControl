import {
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand
} from "@aws-sdk/client-ec2";
import { getEC2Client } from "./clients";
import { EC2State } from "@minecontrol/types";
import { AWSOperationError } from "./errors";

// Get current state of EC2 instance
export async function getInstanceStatus(instanceId: string): Promise<{ state: EC2State; launchTime?: Date }> {
  const client = getEC2Client();
  try {
    const response = await client.send(
      new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      })
    );
    const instance = response.Reservations?.[0]?.Instances?.[0];
    const state = instance?.State?.Name;
    if (!state) {
      throw new Error(`Instance state not returned for ID: ${instanceId}`);
    }
    return {
      state: state as EC2State,
      launchTime: instance.LaunchTime,
    };
  } catch (error: any) {
    throw new AWSOperationError(`Failed obtaining status for ${instanceId}: ${error.message}`, error);
  }
}

// Start EC2 instance
export async function startInstance(instanceId: string): Promise<void> {
  const client = getEC2Client();
  try {
    await client.send(
      new StartInstancesCommand({
        InstanceIds: [instanceId],
      })
    );
  } catch (error: any) {
    throw new AWSOperationError(`Failed executing start instance request for ${instanceId}: ${error.message}`, error);
  }
}

// Stop EC2 instance
export async function stopInstance(instanceId: string): Promise<void> {
  const client = getEC2Client();
  try {
    await client.send(
      new StopInstancesCommand({
        InstanceIds: [instanceId],
      })
    );
  } catch (error: any) {
    throw new AWSOperationError(`Failed executing stop instance request for ${instanceId}: ${error.message}`, error);
  }
}

// Poll state until instance status is running
export async function waitForInstanceRunning(
  instanceId: string,
  timeoutMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const status = await getInstanceStatus(instanceId);
    if (status.state === "running") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new AWSOperationError(`Timed out waiting for instance ${instanceId} state to be running.`);
}

// Poll state until instance status is stopped
export async function waitForInstanceStopped(
  instanceId: string,
  timeoutMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const status = await getInstanceStatus(instanceId);
    if (status.state === "stopped") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new AWSOperationError(`Timed out waiting for instance ${instanceId} state to be stopped.`);
}

