import { z } from "zod";

export const EC2StateSchema = z.enum([
  "pending",
  "running",
  "stopping",
  "stopped",
  "shutting-down",
  "terminated"
]);
export type EC2State = z.infer<typeof EC2StateSchema>;

export const MinecraftStateSchema = z.enum([
  "online",
  "offline",
  "starting",
  "stopping"
]);
export type MinecraftState = z.infer<typeof MinecraftStateSchema>;

export const ServerStatusSchema = z.object({
  ec2: z.object({
    state: EC2StateSchema,
    uptime: z.string(),
  }),
  minecraft: z.object({
    state: MinecraftStateSchema,
    players: z.number().int().nonnegative(),
    maxPlayers: z.number().int().nonnegative(),
    latency: z.number().int().nullable(),
  }),
});
export type ServerStatus = z.infer<typeof ServerStatusSchema>;

export interface DashboardStatus {
  ec2State: EC2State;
  minecraftState: MinecraftState;
  playerCount: number;
  maxPlayers: number;
  pingMs: number | null;
  uptimeSeconds: number;
}


export interface MinecraftInfo {
  online: boolean;
  players: number;
  maxPlayers: number;
  latency: number | null;
}
