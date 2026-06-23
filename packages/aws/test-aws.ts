import * as fs from "fs";
import * as path from "path";

// Load root .env
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

import {
  getInstanceStatus,
  getAutoStopEnabled,
  getLastPlayerSeen,
  getMinecraftInfo
} from "./index";

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
    } catch {}
  }

  console.log("\n--- Testing Minecraft Service ---");
  console.log(`Pinging Minecraft server at ${serverAddress}...`);
  try {
    const info = await getMinecraftInfo(serverAddress, 3000);
    console.log("Minecraft status response:", info);
  } catch (err: any) {
    console.error("Minecraft ping failed:", err.message);
  }

  console.log("\n--- Testing EC2 Service ---");
  try {
    const instanceId = process.env.EC2_INSTANCE_ID || "i-mockinstanceid";
    console.log(`Getting status of instance: ${instanceId}`);
    const status = await getInstanceStatus(instanceId);
    console.log("EC2 Instance status:", status.state, "LaunchTime:", status.launchTime);
  } catch (err: any) {
    console.warn("EC2 status query failed (expected if no credentials or bad ID):", err.message);
  }

  console.log("\n--- Testing Parameter Store Service ---");
  try {
    console.log("Getting autostop config status...");
    const autostop = await getAutoStopEnabled();
    console.log("Autostop enabled:", autostop);

    console.log("Getting last player seen timestamp...");
    const lastPlayer = await getLastPlayerSeen();
    console.log("Last player seen date:", lastPlayer);
  } catch (err: any) {
    console.warn("Parameter Store query failed (expected if no credentials):", err.message);
  }

  console.log("\n=== Test complete ===");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
});
