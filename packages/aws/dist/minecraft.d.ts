import { MinecraftInfo } from "@minecontrol/types";
export declare function getMinecraftInfo(serverAddress: string, timeoutMs?: number): Promise<MinecraftInfo>;
export declare function waitForMinecraftOnline(serverAddress: string, timeoutMs?: number, pollIntervalMs?: number): Promise<void>;
export declare function waitForMinecraftOffline(serverAddress: string, timeoutMs?: number, pollIntervalMs?: number): Promise<void>;
