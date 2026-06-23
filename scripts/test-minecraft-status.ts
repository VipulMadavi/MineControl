import * as net from "net";

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

async function testPing(serverAddress: string) {
  console.log("[Test] Parsing address:", serverAddress);
  let host = serverAddress;
  let port = 25565;
  if (serverAddress.includes(":")) {
    const parts = serverAddress.split(":");
    host = parts[0];
    port = parseInt(parts[1], 10) || 25565;
  }
  console.log(`[Test] Connecting to Host: ${host}, Port: ${port}`);

  return new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    let dataBuffer = Buffer.alloc(0);
    const startTime = Date.now();

    socket.setTimeout(5000);

    socket.on("connect", () => {
      console.log("[Test] TCP socket connected. Sending handshake...");
      // Send handshake with protocol version 47 (Minecraft 1.8)
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
      console.log("[Test] Handshake & Request packets sent.");
    });

    socket.on("data", (data) => {
      const chunk = typeof data === "string" ? Buffer.from(data) : data;
      console.log(`[Test] Received data chunk of size ${chunk.length}`);
      dataBuffer = Buffer.concat([dataBuffer, chunk]);
      try {
        const offset = { current: 0 };
        const packetLength = readVarInt(dataBuffer, offset);
        console.log(`[Test] Packet length header: ${packetLength}, current buffer size: ${dataBuffer.length}`);
        
        if (dataBuffer.length < offset.current + packetLength) {
          console.log("[Test] Waiting for more bytes...");
          return;
        }

        const packetId = readVarInt(dataBuffer, offset);
        console.log(`[Test] Packet ID: ${packetId}`);
        if (packetId !== 0x00) {
          throw new Error(`Unexpected packet ID: ${packetId}`);
        }

        const jsonLength = readVarInt(dataBuffer, offset);
        console.log(`[Test] JSON string length: ${jsonLength}`);
        if (dataBuffer.length < offset.current + jsonLength) {
          console.log("[Test] Waiting for JSON bytes...");
          return;
        }

        const jsonStr = dataBuffer.subarray(offset.current, offset.current + jsonLength).toString("utf8");
        console.log("[Test] Raw JSON Response:", jsonStr);
        const parsed = JSON.parse(jsonStr);
        
        console.log("\n=== Minecraft Query Status SUCCESS ===");
        console.log("Online: true");
        console.log("Players:", parsed.players?.online ?? 0);
        console.log("Max Players:", parsed.players?.max ?? 0);
        console.log("Latency:", Date.now() - startTime, "ms");
        console.log("Version:", parsed.version?.name ?? "Unknown");
        console.log("======================================\n");

        socket.destroy();
        resolve();
      } catch (err) {
        if (err instanceof Error && err.message.includes("out of bounds")) {
          return;
        }
        console.error("[Test] Data parsing error:", err);
        socket.destroy();
        reject(err);
      }
    });

    socket.on("timeout", () => {
      console.error("[Test] Connection timed out.");
      socket.destroy();
      reject(new Error("Timeout"));
    });

    socket.on("error", (err) => {
      console.error("[Test] Socket error:", err);
      socket.destroy();
      reject(err);
    });

    socket.connect(port, host);
  });
}

testPing("13.205.205.48:31121").catch(() => {
  console.log("\n=== Minecraft Query Status FAILED ===\n");
});
