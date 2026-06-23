import { EC2State } from "@minecontrol/types";
export declare function getInstanceStatus(instanceId: string): Promise<{
    state: EC2State;
    launchTime?: Date;
}>;
export declare function startInstance(instanceId: string): Promise<void>;
export declare function stopInstance(instanceId: string): Promise<void>;
export declare function waitForInstanceRunning(instanceId: string, timeoutMs?: number, pollIntervalMs?: number): Promise<void>;
export declare function waitForInstanceStopped(instanceId: string, timeoutMs?: number, pollIntervalMs?: number): Promise<void>;
