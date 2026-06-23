import * as net from "net";
import { MinecraftInfo } from "@minecontrol/types";
import { MinecraftTimeoutError } from "./errors";

function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  do {
    let temp = value & 0b01111111;
    value >>>= 7;
    if (value !== 0) {
      temp |= 0b10000000;
    }
    bytes.push(temp);
  } while (value !== 0);
  return Buffer.from(bytes);
}

function readVarInt(buffer: Buffer, offset: { current: number }): number {
  let value = 0;
  let position = 0;
  let byte;
  while (true) {
    if (offset.current >= buffer.length) {
      throw new Error("VarInt out of bounds");
    }
    byte = buffer[offset.current++];
    value |= (byte & 0x7f) << position;
    if ((byte & 0x80) === 0) break;
    position += 7;
    if (position >= 32) {
      throw new Error("VarInt is too big");
    }
  }
  return value;
}

function writeString(value: string): Buffer {
  const strBytes = Buffer.from(value, "utf8");
  const lenBytes = writeVarInt(strBytes.length);
  return Buffer.concat([lenBytes, strBytes]);
}

// Queries Minecraft server info via TCP list ping
export function getMinecraftInfo(
  serverAddress: string,
  timeoutMs: number = 5000
): Promise<MinecraftInfo> {
  console.log("[Minecraft] Querying:", serverAddress);

  return new Promise((resolve) => {
    let host = serverAddress;
    let port = 25565;
    if (serverAddress.includes(":")) {
      const parts = serverAddress.split(":");
      host = parts[0];
      port = parseInt(parts[1], 10) || 25565;
    }

    console.log(`[Minecraft] Connection Attempt: Connecting to Host: ${host}, Port: ${port}`);

    const socket = new net.Socket();
    let dataBuffer = Buffer.alloc(0);
    const startTime = Date.now();

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      const handshakeBuffer = Buffer.concat([
        writeVarInt(0x00),
        writeVarInt(47),
        writeString(host),
        (() => {
          const buf = Buffer.alloc(2);
          buf.writeUInt16BE(port, 0);
          return buf;
        })(),
        writeVarInt(1),
      ]);
      const handshakePacket = Buffer.concat([
        writeVarInt(handshakeBuffer.length),
        handshakeBuffer,
      ]);

      const requestBuffer = writeVarInt(0x00);
      const requestPacket = Buffer.concat([
        writeVarInt(requestBuffer.length),
        requestBuffer,
      ]);

      socket.write(handshakePacket);
      socket.write(requestPacket);
    });

    socket.on("data", (data) => {
      const chunk = typeof data === "string" ? Buffer.from(data) : data;
      dataBuffer = Buffer.concat([dataBuffer, chunk]);
      try {
        const offset = { current: 0 };
        const packetLength = readVarInt(dataBuffer, offset);
        
        if (dataBuffer.length < offset.current + packetLength) {
          return; // Needs more bytes
        }

        const packetId = readVarInt(dataBuffer, offset);
        if (packetId !== 0x00) {
          throw new Error(`Unexpected packet ID: ${packetId}`);
        }

        const jsonLength = readVarInt(dataBuffer, offset);
        if (dataBuffer.length < offset.current + jsonLength) {
          return; // Needs more bytes
        }

        const jsonStr = dataBuffer.subarray(offset.current, offset.current + jsonLength).toString("utf8");
        const parsed = JSON.parse(jsonStr);
        const latency = Date.now() - startTime;
        
        let players = 0;
        let maxPlayers = 0;
        if (parsed.players) {
          players = typeof parsed.players.online === "number" ? parsed.players.online : 0;
          maxPlayers = typeof parsed.players.max === "number" ? parsed.players.max : 0;
        }

        const result = {
          online: true,
          players,
          maxPlayers,
          latency,
        };
        console.log("[Minecraft] Response:", result);
        socket.destroy();
        resolve(result);
      } catch (err) {
        if (err instanceof Error && err.message.includes("out of bounds")) {
          return;
        }
        console.error("[Minecraft] Query Failed (Data Parsing):", err);
        socket.destroy();
        resolve({
          online: false,
          players: 0,
          maxPlayers: 0,
          latency: null,
        });
      }
    });

    socket.on("timeout", () => {
      console.error("[Minecraft] Query Failed: Connection timed out.");
      socket.destroy();
      resolve({
        online: false,
        players: 0,
        maxPlayers: 0,
        latency: null,
      });
    });

    socket.on("error", (err) => {
      console.error("[Minecraft] Query Failed (Socket Error):", err);
      socket.destroy();
      resolve({
        online: false,
        players: 0,
        maxPlayers: 0,
        latency: null,
      });
    });

    socket.connect(port, host);
  });
}

// Wait for Minecraft server to respond online
export async function waitForMinecraftOnline(
  serverAddress: string,
  timeoutMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const info = await getMinecraftInfo(serverAddress, 3000);
    if (info.online) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new MinecraftTimeoutError(`Timed out waiting for Minecraft server on ${serverAddress} to come online.`);
}

// Wait for Minecraft server to go offline
export async function waitForMinecraftOffline(
  serverAddress: string,
  timeoutMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const info = await getMinecraftInfo(serverAddress, 3000);
    if (!info.online) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new MinecraftTimeoutError(`Timed out waiting for Minecraft server on ${serverAddress} to go offline.`);
}
