"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load root .env
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        const index = trimmed.indexOf("=");
        if (index === -1)
            continue;
        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}
const index_1 = require("./index");
async function runTests() {
    console.log("=== MineControl AWS Package Test ===");
    console.log("Region:", process.env.AWS_REGION || "not set");
    console.log("Access Key ID:", process.env.AWS_ACCESS_KEY_ID ? "configured" : "not set");
    // Read config.json to get minecraft server address / instance details if any
    const configPath = path.resolve(__dirname, "../../config.json");
    let serverAddress = "localhost:25565";
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
            if (config.minecraft?.server_address) {
                serverAddress = config.minecraft.server_address;
            }
        }
        catch { }
    }
    console.log("\n--- Testing Minecraft Service ---");
    console.log(`Pinging Minecraft server at ${serverAddress}...`);
    try {
        const info = await (0, index_1.getMinecraftInfo)(serverAddress, 3000);
        console.log("Minecraft status response:", info);
    }
    catch (err) {
        console.error("Minecraft ping failed:", err.message);
    }
    console.log("\n--- Testing EC2 Service ---");
    try {
        const instanceId = process.env.EC2_INSTANCE_ID || "i-mockinstanceid";
        console.log(`Getting status of instance: ${instanceId}`);
        const status = await (0, index_1.getInstanceStatus)(instanceId);
        console.log("EC2 Instance status:", status.state, "LaunchTime:", status.launchTime);
    }
    catch (err) {
        console.warn("EC2 status query failed (expected if no credentials or bad ID):", err.message);
    }
    console.log("\n--- Testing Parameter Store Service ---");
    try {
        console.log("Getting autostop config status...");
        const autostop = await (0, index_1.getAutoStopEnabled)();
        console.log("Autostop enabled:", autostop);
        console.log("Getting last player seen timestamp...");
        const lastPlayer = await (0, index_1.getLastPlayerSeen)();
        console.log("Last player seen date:", lastPlayer);
    }
    catch (err) {
        console.warn("Parameter Store query failed (expected if no credentials):", err.message);
    }
    console.log("\n=== Test complete ===");
}
runTests().catch((err) => {
    console.error("Test execution failed:", err);
});
