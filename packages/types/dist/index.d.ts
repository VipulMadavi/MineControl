import { z } from "zod";
export declare const EC2StateSchema: z.ZodEnum<{
    pending: "pending";
    running: "running";
    stopping: "stopping";
    stopped: "stopped";
    "shutting-down": "shutting-down";
    terminated: "terminated";
}>;
export type EC2State = z.infer<typeof EC2StateSchema>;
export declare const MinecraftStateSchema: z.ZodEnum<{
    stopping: "stopping";
    online: "online";
    offline: "offline";
    starting: "starting";
}>;
export type MinecraftState = z.infer<typeof MinecraftStateSchema>;
export declare const ServerStatusSchema: z.ZodObject<{
    ec2: z.ZodObject<{
        state: z.ZodEnum<{
            pending: "pending";
            running: "running";
            stopping: "stopping";
            stopped: "stopped";
            "shutting-down": "shutting-down";
            terminated: "terminated";
        }>;
        uptime: z.ZodString;
    }, z.core.$strip>;
    minecraft: z.ZodObject<{
        state: z.ZodEnum<{
            stopping: "stopping";
            online: "online";
            offline: "offline";
            starting: "starting";
        }>;
        players: z.ZodNumber;
        maxPlayers: z.ZodNumber;
        latency: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
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
