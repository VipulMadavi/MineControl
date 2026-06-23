"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = runCommand;
exports.startMinecraft = startMinecraft;
exports.stopMinecraft = stopMinecraft;
exports.waitForSSM = waitForSSM;
const client_ssm_1 = require("@aws-sdk/client-ssm");
const clients_1 = require("./clients");
const errors_1 = require("./errors");
// Send shell command to instance via SSM RunShellScript
async function runCommand(instanceId, command) {
    const client = (0, clients_1.getSSMClient)();
    try {
        const response = await client.send(new client_ssm_1.SendCommandCommand({
            InstanceIds: [instanceId],
            DocumentName: "AWS-RunShellScript",
            Parameters: {
                commands: [command],
            },
        }));
        const commandId = response.Command?.CommandId;
        if (!commandId) {
            throw new Error("No CommandID returned from SSM SendCommand execution.");
        }
        return commandId;
    }
    catch (error) {
        throw new errors_1.AWSOperationError(`Failed executing SSM command on ${instanceId}: ${error.message}`, error);
    }
}
// Start Minecraft Server process
async function startMinecraft(instanceId) {
    return runCommand(instanceId, "cd /home/ubuntu/minecraft && ./start.sh");
}
// Stop Minecraft Server process
async function stopMinecraft(instanceId) {
    return runCommand(instanceId, "stop");
}
// Wait for SSM agent on instance to be online
async function waitForSSM(instanceId, timeoutMs = 300000, pollIntervalMs = 5000) {
    const client = (0, clients_1.getSSMClient)();
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        try {
            const response = await client.send(new client_ssm_1.DescribeInstanceInformationCommand({}));
            const instance = response.InstanceInformationList?.find((info) => info.InstanceId === instanceId);
            if (instance && instance.PingStatus === "Online") {
                return;
            }
        }
        catch (error) {
            console.warn(`[ssm] Error checking instance information status: ${error.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new errors_1.AWSOperationError(`Timed out waiting for SSM agent on ${instanceId} to be online.`);
}
