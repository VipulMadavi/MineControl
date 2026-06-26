import { GetParameterCommand, PutParameterCommand } from "@aws-sdk/client-ssm";
import { getSSMClient } from "./clients";

const PARAM_ENABLED = "/minecontrol/autostop/enabled";

export interface AutostopState {
  enabled: boolean;
  maintenanceUntil: string | null;
  inMaintenance: boolean;
  active: boolean;
}

/**
 * Read autostop enabled state from SSM Parameter Store.
 * Defaults to enabled on any failure (missing param, no creds, etc).
 */
export async function getAutostopState(): Promise<AutostopState> {
  const defaults: AutostopState = {
    enabled: true,
    maintenanceUntil: null,
    inMaintenance: false,
    active: true,
  };

  try {
    const ssm = getSSMClient();
    const res = await ssm.send(new GetParameterCommand({ Name: PARAM_ENABLED }));
    const enabled = res.Parameter?.Value === "true";

    return { enabled, maintenanceUntil: null, inMaintenance: false, active: enabled };
  } catch (error) {
    console.error("[parameter-store] getAutostopState failed:", (error as Error).message);
    return defaults;
  }
}

/**
 * Set the autostop enabled/disabled preference.
 */
export async function setAutostopEnabled(enabled: boolean): Promise<void> {
  const ssm = getSSMClient();
  await ssm.send(
    new PutParameterCommand({
      Name: PARAM_ENABLED,
      Value: enabled ? "true" : "false",
      Type: "String",
      Overwrite: true,
    })
  );
}
