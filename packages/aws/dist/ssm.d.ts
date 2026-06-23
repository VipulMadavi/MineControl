export declare function runCommand(instanceId: string, command: string): Promise<string>;
export declare function runCommandWithOutput(instanceId: string, command: string, timeoutMs?: number): Promise<{
    commandId: string;
    status: string;
    stdout: string;
    stderr: string;
}>;
export declare function startMinecraft(instanceId: string): Promise<string>;
export declare function stopMinecraft(instanceId: string): Promise<{
    commandId: string;
    status: string;
    stdout: string;
    stderr: string;
}>;
export declare function waitForSSM(instanceId: string, timeoutMs?: number, pollIntervalMs?: number): Promise<void>;
