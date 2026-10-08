/**
 * Local Vite adapter. Production requests are served by functions/api/gemini/[[path]].ts.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { GENERATION_LIMIT, TOKEN_LIMIT, handleGeminiRequest, type GeminiBucket } from "./geminiHandlers";

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

type Next = (err?: unknown) => void;

function clientIp(req: IncomingMessage): string {
  return req.socket.remoteAddress || "unknown";
}

function allowLocal(ip: string, bucket: GeminiBucket): boolean {
  const limit = bucket === "live-token" ? TOKEN_LIMIT : GENERATION_LIMIT;
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 1000) {
    const oldest = hits.keys().next().value;
    if (oldest) hits.delete(oldest);
  }
  return true;
}

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Length", Buffer.byteLength(payload));
  res.end(payload);
}

function bufferRequest(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        fail(new Error("too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on("error", () => fail(new Error("read_error")));
  });
}

async function writeResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key === "content-encoding" || key === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  if (!response.body) {
    res.end();
    return;
  }
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

export function createGeminiMiddleware(apiKey: string) {
  if (typeof window !== "undefined") {
    throw new Error("Gemini server middleware cannot run in the browser.");
  }

  return function geminiMiddleware(req: IncomingMessage, res: ServerResponse, next: Next) {
    const path = (req.url ?? "").split("?")[0];
    if (!path.startsWith("/api/gemini/")) {
      next();
      return;
    }

    void (async () => {
      const host = req.headers.host || "127.0.0.1";
      const method = req.method || "GET";
      const body = method === "GET" || method === "HEAD" ? undefined : await bufferRequest(req);
      const request = new Request(`http://${host}${req.url ?? path}`, {
        method,
        headers: { "content-type": req.headers["content-type"] || "application/json" },
        body,
      });
      const ip = clientIp(req);
      const response = await handleGeminiRequest(request, {
        apiKey,
        allow: async (bucket) => allowLocal(ip, bucket),
      });
      await writeResponse(res, response);
    })().catch((error: unknown) => {
      if (res.headersSent) {
        res.end();
        return;
      }
      const code = error instanceof Error ? error.message : "";
      if (code === "too_large" || code === "invalid_json" || code === "read_error") {
        sendJson(res, 400, { error: "The request was rejected." });
        return;
      }
      sendJson(res, 500, { error: "The model request failed." });
    });
  };
}
