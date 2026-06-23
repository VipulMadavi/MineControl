"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParameter = getParameter;
exports.putParameter = putParameter;
exports.getAutoStopEnabled = getAutoStopEnabled;
exports.setAutoStopEnabled = setAutoStopEnabled;
exports.getLastPlayerSeen = getLastPlayerSeen;
exports.setLastPlayerSeen = setLastPlayerSeen;
const client_ssm_1 = require("@aws-sdk/client-ssm");
const clients_1 = require("./clients");
const errors_1 = require("./errors");
const AUTOSTOP_ENABLED_PATH = "/minecontrol/autostop/enabled";
const LAST_PLAYER_SEEN_PATH = "/minecontrol/last-player-seen";
// Fetch raw parameter value
async function getParameter(name) {
    const client = (0, clients_1.getSSMClient)();
    try {
        const response = await client.send(new client_ssm_1.GetParameterCommand({
            Name: name,
            WithDecryption: true,
        }));
        return response.Parameter?.Value ?? null;
    }
    catch (error) {
        if (error.name === "ParameterNotFound") {
            return null;
        }
        throw new errors_1.ParameterStoreError(`Failed to retrieve parameter ${name}: ${error.message}`, error);
    }
}
// Store raw parameter value
async function putParameter(name, value) {
    const client = (0, clients_1.getSSMClient)();
    try {
        await client.send(new client_ssm_1.PutParameterCommand({
            Name: name,
            Value: value,
            Type: "String",
            Overwrite: true,
        }));
    }
    catch (error) {
        throw new errors_1.ParameterStoreError(`Failed to store parameter ${name}: ${error.message}`, error);
    }
}
// Get autostop enabled status (default true)
async function getAutoStopEnabled() {
    const val = await getParameter(AUTOSTOP_ENABLED_PATH);
    if (val === null)
        return true;
    return val === "true";
}
// Set autostop enabled status
async function setAutoStopEnabled(enabled) {
    await putParameter(AUTOSTOP_ENABLED_PATH, enabled ? "true" : "false");
}
// Get last player seen date
async function getLastPlayerSeen() {
    const val = await getParameter(LAST_PLAYER_SEEN_PATH);
    if (!val)
        return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
}
// Set last player seen date
async function setLastPlayerSeen(date) {
    await putParameter(LAST_PLAYER_SEEN_PATH, date.toISOString());
}
