/**
 * Discord Webhook Audit Logger
 * All server events are sent to the configured Discord webhook.
 * Failures never block application logic.
 */

// Discord embed colors
const COLORS = {
  success: 0x22c55e,   // green
  error:   0xef4444,   // red
  warning: 0xf59e0b,   // amber
  info:    0x3b82f6,   // blue
} as const;

export type AuditColor = keyof typeof COLORS;

export interface AuditField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface AuditLogOptions {
  title: string;
  description?: string;
  color: AuditColor;
  fields?: AuditField[];
}

async function sendAuditLog(options: AuditLogOptions): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not set — skipping audit log.");
    return;
  }

  const payload = {
    embeds: [
      {
        title: "MineControl Audit Log",
        description: `**${options.title}**${options.description ? `\n${options.description}` : ""}`,
        color: COLORS[options.color],
        fields: options.fields ?? [],
        timestamp: new Date().toISOString(),
        footer: {
          text: "MineControl · Infrastructure Audit",
        },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[Discord] Webhook responded with status ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    // Never block application logic
    console.error("[Discord] Failed to send audit log:", (err as Error).message);
  }
}

// ─── Convenience helpers ───────────────────────────────────────────────────

export function logUserLogin(username: string) {
  return sendAuditLog({
    title: "🔐 User Login",
    color: "info",
    fields: [
      { name: "Discord User", value: username, inline: true },
      { name: "Time", value: new Date().toUTCString(), inline: true },
    ],
  });
}

export function logStartRequested(username: string, instanceId: string, region: string) {
  return sendAuditLog({
    title: "🚀 Server Start Requested",
    color: "info",
    fields: [
      { name: "Requested By", value: username, inline: true },
      { name: "Instance ID", value: instanceId, inline: true },
      { name: "Region", value: region, inline: true },
      { name: "Time", value: new Date().toUTCString(), inline: false },
    ],
  });
}

export function logStartSuccess(ec2State: string, minecraftState: string) {
  return sendAuditLog({
    title: "✅ Server Started Successfully",
    color: "success",
    fields: [
      { name: "EC2 Status", value: ec2State, inline: true },
      { name: "Minecraft Status", value: minecraftState, inline: true },
      { name: "Time", value: new Date().toUTCString(), inline: false },
    ],
  });
}

export function logStartFailed(reason: string) {
  return sendAuditLog({
    title: "❌ Startup Failed",
    color: "error",
    fields: [
      { name: "Reason", value: reason, inline: false },
      { name: "Time", value: new Date().toUTCString(), inline: true },
    ],
  });
}

export function logStopRequested(username: string) {
  return sendAuditLog({
    title: "🛑 Server Stop Requested",
    color: "warning",
    fields: [
      { name: "Requested By", value: username, inline: true },
      { name: "Time", value: new Date().toUTCString(), inline: true },
    ],
  });
}

export function logStopSuccess() {
  return sendAuditLog({
    title: "🔴 Server Stopped Successfully",
    color: "success",
    fields: [
      { name: "Time", value: new Date().toUTCString(), inline: true },
    ],
  });
}

export function logStopFailed(reason: string) {
  return sendAuditLog({
    title: "❌ Shutdown Failed",
    color: "error",
    fields: [
      { name: "Reason", value: reason, inline: false },
      { name: "Time", value: new Date().toUTCString(), inline: true },
    ],
  });
}

export function logAwsError(context: string, reason: string) {
  return sendAuditLog({
    title: "❌ AWS Error",
    color: "error",
    fields: [
      { name: "Context", value: context, inline: true },
      { name: "Error", value: reason, inline: false },
      { name: "Time", value: new Date().toUTCString(), inline: true },
    ],
  });
}

export function logAutostopToggled(username: string, enabled: boolean) {
  return sendAuditLog({
    title: enabled ? "🟢 Auto-Stop Enabled" : "⛔ Auto-Stop Disabled",
    color: enabled ? "success" : "warning",
    fields: [
      { name: "Changed By", value: username, inline: true },
      { name: "New State", value: enabled ? "Enabled" : "Disabled", inline: true },
      { name: "Time", value: new Date().toUTCString(), inline: false },
    ],
  });
}
