"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstanceStatus = getInstanceStatus;
exports.startInstance = startInstance;
exports.stopInstance = stopInstance;
exports.waitForInstanceRunning = waitForInstanceRunning;
exports.waitForInstanceStopped = waitForInstanceStopped;
const client_ec2_1 = require("@aws-sdk/client-ec2");
const clients_1 = require("./clients");
const errors_1 = require("./errors");
// Get current state of EC2 instance
async function getInstanceStatus(instanceId) {
    const client = (0, clients_1.getEC2Client)();
    try {
        const response = await client.send(new client_ec2_1.DescribeInstancesCommand({
            InstanceIds: [instanceId],
        }));
        const instance = response.Reservations?.[0]?.Instances?.[0];
        const state = instance?.State?.Name;
        if (!state) {
            throw new Error(`Instance state not returned for ID: ${instanceId}`);
        }
        return {
            state: state,
            launchTime: instance.LaunchTime,
        };
    }
    catch (error) {
        throw new errors_1.AWSOperationError(`Failed obtaining status for ${instanceId}: ${error.message}`, error);
    }
}
// Start EC2 instance
async function startInstance(instanceId) {
    const client = (0, clients_1.getEC2Client)();
    try {
        await client.send(new client_ec2_1.StartInstancesCommand({
            InstanceIds: [instanceId],
        }));
    }
    catch (error) {
        throw new errors_1.AWSOperationError(`Failed executing start instance request for ${instanceId}: ${error.message}`, error);
    }
}
// Stop EC2 instance
async function stopInstance(instanceId) {
    const client = (0, clients_1.getEC2Client)();
    try {
        await client.send(new client_ec2_1.StopInstancesCommand({
            InstanceIds: [instanceId],
        }));
    }
    catch (error) {
        throw new errors_1.AWSOperationError(`Failed executing stop instance request for ${instanceId}: ${error.message}`, error);
    }
}
// Poll state until instance status is running
async function waitForInstanceRunning(instanceId, timeoutMs = 300000, pollIntervalMs = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        const status = await getInstanceStatus(instanceId);
        if (status.state === "running") {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new errors_1.AWSOperationError(`Timed out waiting for instance ${instanceId} state to be running.`);
}
// Poll state until instance status is stopped
async function waitForInstanceStopped(instanceId, timeoutMs = 300000, pollIntervalMs = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        const status = await getInstanceStatus(instanceId);
        if (status.state === "stopped") {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
    throw new errors_1.AWSOperationError(`Timed out waiting for instance ${instanceId} state to be stopped.`);
}
