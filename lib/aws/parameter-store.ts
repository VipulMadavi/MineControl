import { GetParameterCommand, PutParameterCommand } from "@aws-sdk/client-ssm";
import { getSSMClient } from "./clients";

const PARAM_ENABLED = "/minecontrol/autostop/enabled";
const PARAM_MAINTENANCE_UNTIL = "/minecontrol/maintenance-until";

export interface AutostopState {
  enabled: boolean;
  maintenanceUntil: string | null;
  inMaintenance: boolean;
  active: boolean;
}

/**
 * Read autostop parameters from SSM Parameter Store.
 * Gracefully defaults to all-false on any failure (missing params, no creds, etc).
 */
export async function getAutostopState(): Promise<AutostopState> {
  const defaults: AutostopState = {
    enabled: false,
    maintenanceUntil: null,
    inMaintenance: false,
    active: false,
  };

  try {
    const ssm = getSSMClient();

    const [enabledRes, maintenanceRes] = await Promise.allSettled([
      ssm.send(new GetParameterCommand({ Name: PARAM_ENABLED })),
      ssm.send(new GetParameterCommand({ Name: PARAM_MAINTENANCE_UNTIL })),
    ]);

    const enabledValue =
      enabledRes.status === "fulfilled"
        ? enabledRes.value.Parameter?.Value
        : undefined;
    const maintenanceValue =
      maintenanceRes.status === "fulfilled"
        ? maintenanceRes.value.Parameter?.Value
        : undefined;

    const enabled = enabledValue === "true";
    const maintenanceUntil =
      maintenanceValue && maintenanceValue.length > 0 ? maintenanceValue : null;
    const inMaintenance =
      !!maintenanceUntil && Date.now() < Date.parse(maintenanceUntil);
    const active = enabled && !inMaintenance;

    return { enabled, maintenanceUntil, inMaintenance, active };
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

/**
 * Set or clear the maintenance window.
 * Pass an ISO string to set, or null to clear.
 */
export async function setMaintenanceUntil(iso: string | null): Promise<void> {
  const ssm = getSSMClient();
  await ssm.send(
    new PutParameterCommand({
      Name: PARAM_MAINTENANCE_UNTIL,
      Value: iso || "",
      Type: "String",
      Overwrite: true,
    })
  );
}
