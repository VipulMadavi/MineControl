import { GetParameterCommand, PutParameterCommand } from "@aws-sdk/client-ssm";
import { getSSMClient } from "./clients";
import { ParameterStoreError } from "./errors";

const AUTOSTOP_ENABLED_PATH = "/minecontrol/autostop/enabled";
const LAST_PLAYER_SEEN_PATH = "/minecontrol/last-player-seen";

// Fetch raw parameter value
export async function getParameter(name: string): Promise<string | null> {
  const client = getSSMClient();
  try {
    const response = await client.send(
      new GetParameterCommand({
        Name: name,
        WithDecryption: true,
      })
    );
    return response.Parameter?.Value ?? null;
  } catch (error: any) {
    if (error.name === "ParameterNotFound") {
      return null;
    }
    throw new ParameterStoreError(`Failed to retrieve parameter ${name}: ${error.message}`, error);
  }
}

// Store raw parameter value
export async function putParameter(name: string, value: string): Promise<void> {
  const client = getSSMClient();
  try {
    await client.send(
      new PutParameterCommand({
        Name: name,
        Value: value,
        Type: "String",
        Overwrite: true,
      })
    );
  } catch (error: any) {
    throw new ParameterStoreError(`Failed to store parameter ${name}: ${error.message}`, error);
  }
}

// Get autostop enabled status (default true)
export async function getAutoStopEnabled(): Promise<boolean> {
  const val = await getParameter(AUTOSTOP_ENABLED_PATH);
  if (val === null) return true;
  return val === "true";
}

// Set autostop enabled status
export async function setAutoStopEnabled(enabled: boolean): Promise<void> {
  await putParameter(AUTOSTOP_ENABLED_PATH, enabled ? "true" : "false");
}

// Get last player seen date
export async function getLastPlayerSeen(): Promise<Date | null> {
  const val = await getParameter(LAST_PLAYER_SEEN_PATH);
  if (!val) return null;
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
}

// Set last player seen date
export async function setLastPlayerSeen(date: Date): Promise<void> {
  await putParameter(LAST_PLAYER_SEEN_PATH, date.toISOString());
}
