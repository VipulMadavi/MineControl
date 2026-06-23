"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerStatusSchema = exports.MinecraftStateSchema = exports.EC2StateSchema = void 0;
const zod_1 = require("zod");
exports.EC2StateSchema = zod_1.z.enum([
    "pending",
    "running",
    "stopping",
    "stopped",
    "shutting-down",
    "terminated"
]);
exports.MinecraftStateSchema = zod_1.z.enum([
    "online",
    "offline",
    "starting",
    "stopping",
    "recovery"
]);
exports.ServerStatusSchema = zod_1.z.object({
    ec2: zod_1.z.object({
        state: exports.EC2StateSchema,
        uptime: zod_1.z.string(),
    }),
    minecraft: zod_1.z.object({
        state: exports.MinecraftStateSchema,
        players: zod_1.z.number().int().nonnegative(),
        maxPlayers: zod_1.z.number().int().nonnegative(),
        latency: zod_1.z.number().int().nullable(),
    }),
});
