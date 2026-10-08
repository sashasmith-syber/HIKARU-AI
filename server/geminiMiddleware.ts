/**
 * Server-only Gemini boundary. Import this from vite.config.ts only.
 * The permanent API key must never reach browser code.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { GoogleGenAI } from "@google/genai";
import { IMAGE_MODEL, MAX_THINKING_BUDGET, TEXT_MODELS } from "../src/constants/models";
import {
  LIVE_MODEL,
  LIVE_NEW_SESSION_TTL_MS,
  LIVE_TOKEN_TTL_MS,
  LIVE_TOKEN_USES,
  liveConnectConfig,
} from "../src/constants/liveSession";

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const MAX_TEXT_CHARS = 100_000;
const MAX_SYSTEM_CHARS = 20_000;
const MAX_IMAGE_PROMPT_CHARS = 8_000;
const MAX_CONTENTS = 40;
const MAX_PARTS = 4;
const MAX_INLINE_CHARS = 5_500_000;
const MAX_SCHEMA_CHARS = 16_000;
const MAX_SCHEMA_DEPTH = 12;
const MAX_OUTPUT_TOKENS = 16384;
const MAX_OUTPUT_CHARS = 200_000;
const MAX_IMAGE_DATA_CHARS = 8_000_000;
const WINDOW_MS = 60_000;
const GENERATION_LIMIT = 30;
const TOKEN_LIMIT = 6;

const hits = new Map<string, number[]>();

type Next = (err?: unknown) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function clientIp(req: IncomingMessage): string {
  return req.socket.remoteAddress || "unknown";
}

function allow(ip: string, bucket: string, limit: number): boolean {
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

function readBody(req: IncomingMessage, maxBytes: number): Promise<unknown> {
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
      if (size > maxBytes) {
        fail(new Error("too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      if (size === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    req.on("error", () => fail(new Error("read_error")));
  });
}

function depthOf(value: unknown, level = 0): number {
  if (!value || typeof value !== "object" || level > MAX_SCHEMA_DEPTH) return level;
  let max = level;
  for (const child of Object.values(value as object)) {
    max = Math.max(max, depthOf(child, level + 1));
    if (max > MAX_SCHEMA_DEPTH) return max;
  }
  return max;
}

function hasForbiddenKey(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  for (const key of Object.keys(value as object)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") return true;
    if (hasForbiddenKey((value as Record<string, unknown>)[key])) return true;
  }
  return false;
}

function reject(res: ServerResponse) {
  sendJson(res, 400, { error: "The request was rejected." });
}

function validateTextPart(part: Record<string, unknown>): { text: string } | null {
  if (typeof part.text !== "string") return null;
  if (Object.keys(part).length !== 1) return null;
  if (part.text.length > MAX_TEXT_CHARS) return null;
  return { text: part.text };
}

function validateInlinePart(part: Record<string, unknown>): { inlineData: { mimeType: string; data: string } } | null {
  if (!isRecord(part.inlineData)) return null;
  if (Object.keys(part).length !== 1) return null;
  const mimeType = part.inlineData.mimeType;
  const data = part.inlineData.data;
  if (typeof mimeType !== "string" || typeof data !== "string") return null;
  if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(mimeType)) return null;
  if (data.length > MAX_INLINE_CHARS || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  return { inlineData: { mimeType, data } };
}

function validateContents(value: unknown): Array<{ role: "user" | "model"; parts: Array<Record<string, unknown>> }> | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_CONTENTS) return null;
  let inlineChars = 0;
  const contents = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (item.role !== "user" && item.role !== "model") return null;
    if (!Array.isArray(item.parts) || item.parts.length === 0 || item.parts.length > MAX_PARTS) return null;
    const parts = [];
    for (const part of item.parts) {
      if (!isRecord(part)) return null;
      const text = validateTextPart(part);
      if (text) {
        parts.push(text);
        continue;
      }
      const inline = validateInlinePart(part);
      if (!inline) return null;
      inlineChars += inline.inlineData.data.length;
      if (inlineChars > MAX_INLINE_CHARS) return null;
      parts.push(inline);
    }
    contents.push({ role: item.role, parts });
  }
  return contents;
}

function readBudget(value: unknown): number | undefined | null {
  if (value == null) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_THINKING_BUDGET) {
    return null;
  }
  return value;
}

function createClient(apiKey: string): GoogleGenAI | null {
  const key = apiKey.trim();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

async function handleStream(req: IncomingMessage, res: ServerResponse, apiKey: string) {
  if (!allow(clientIp(req), "generation", GENERATION_LIMIT)) {
    res.setHeader("Retry-After", "60");
    sendJson(res, 429, { error: "Too many requests. Try again shortly." });
    return;
  }
  const ai = createClient(apiKey);
  if (!ai) {
    sendJson(res, 503, { error: "The model service is not configured." });
    return;
  }

  let body: unknown;
  try {
    body = await readBody(req, MAX_BODY_BYTES);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "too_large" || code === "invalid_json") reject(res);
    else sendJson(res, 400, { error: "The request was rejected." });
    return;
  }
  if (!isRecord(body) || hasForbiddenKey(body)) {
    reject(res);
    return;
  }

  const model = body.model;
  const systemInstruction = body.systemInstruction ?? "";
  const budget = readBudget(body.thinkingBudget);
  const contents = validateContents(body.contents);
  if (typeof model !== "string" || !TEXT_MODELS.has(model)) {
    reject(res);
    return;
  }
  if (typeof systemInstruction !== "string" || systemInstruction.length > MAX_SYSTEM_CHARS) {
    reject(res);
    return;
  }
  if (budget === null || !contents) {
    reject(res);
    return;
  }
  if (budget != null && model !== "gemini-3-pro-preview") {
    reject(res);
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.flushHeaders();

  try {
    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        ...(budget != null ? { thinkingConfig: { thinkingBudget: budget } } : {}),
      },
    });
    let emitted = 0;
    for await (const chunk of stream) {
      const text = typeof chunk.text === "string" ? chunk.text : "";
      if (!text) continue;
      const room = MAX_OUTPUT_CHARS - emitted;
      if (room <= 0) break;
      const slice = text.slice(0, room);
      emitted += slice.length;
      res.write(`data: ${JSON.stringify({ text: slice })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch {
    if (!res.headersSent) {
      sendJson(res, 502, { error: "The model request failed." });
      return;
    }
    res.write(`data: ${JSON.stringify({ error: "The model request failed." })}\n\n`);
    res.end();
  }
}

async function handleImage(req: IncomingMessage, res: ServerResponse, apiKey: string) {
  if (!allow(clientIp(req), "generation", GENERATION_LIMIT)) {
    res.setHeader("Retry-After", "60");
    sendJson(res, 429, { error: "Too many requests. Try again shortly." });
    return;
  }
  const ai = createClient(apiKey);
  if (!ai) {
    sendJson(res, 503, { error: "The model service is not configured." });
    return;
  }

  let body: unknown;
  try {
    body = await readBody(req, 32_000);
  } catch {
    reject(res);
    return;
  }
  if (!isRecord(body) || typeof body.prompt !== "string") {
    reject(res);
    return;
  }
  const prompt = body.prompt.trim();
  if (!prompt || prompt.length > MAX_IMAGE_PROMPT_CHARS || Object.keys(body).some((key) => key !== "prompt")) {
    reject(res);
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      const inline = part.inlineData;
      if (!inline?.data || !inline.mimeType) continue;
      if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(inline.mimeType)) continue;
      if (inline.data.length > MAX_IMAGE_DATA_CHARS) continue;
      sendJson(res, 200, { image: `data:${inline.mimeType};base64,${inline.data}` });
      return;
    }
    sendJson(res, 502, { error: "The model request failed." });
  } catch {
    sendJson(res, 502, { error: "The model request failed." });
  }
}

async function handleJson(req: IncomingMessage, res: ServerResponse, apiKey: string) {
  if (!allow(clientIp(req), "generation", GENERATION_LIMIT)) {
    res.setHeader("Retry-After", "60");
    sendJson(res, 429, { error: "Too many requests. Try again shortly." });
    return;
  }
  const ai = createClient(apiKey);
  if (!ai) {
    sendJson(res, 503, { error: "The model service is not configured." });
    return;
  }

  let body: unknown;
  try {
    body = await readBody(req, 64_000);
  } catch {
    reject(res);
    return;
  }
  if (!isRecord(body) || hasForbiddenKey(body)) {
    reject(res);
    return;
  }
  const model = body.model;
  const prompt = body.prompt;
  const schema = body.schema;
  if (typeof model !== "string" || !TEXT_MODELS.has(model)) {
    reject(res);
    return;
  }
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > MAX_TEXT_CHARS) {
    reject(res);
    return;
  }
  if (!isRecord(schema) || depthOf(schema) > MAX_SCHEMA_DEPTH) {
    reject(res);
    return;
  }
  const schemaText = JSON.stringify(schema);
  if (schemaText.length > MAX_SCHEMA_CHARS) {
    reject(res);
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    const jsonText = response.text?.trim() ?? "";
    if (!jsonText || jsonText.length > MAX_OUTPUT_CHARS) {
      sendJson(res, 502, { error: "The model request failed." });
      return;
    }
    const result = JSON.parse(jsonText);
    sendJson(res, 200, { result });
  } catch {
    sendJson(res, 502, { error: "The model request failed." });
  }
}

async function handleLiveToken(req: IncomingMessage, res: ServerResponse, apiKey: string) {
  if (!allow(clientIp(req), "live-token", TOKEN_LIMIT)) {
    res.setHeader("Retry-After", "60");
    sendJson(res, 429, { error: "Too many requests. Try again shortly." });
    return;
  }
  const ai = createClient(apiKey);
  if (!ai) {
    sendJson(res, 503, { error: "The model service is not configured." });
    return;
  }

  try {
    await readBody(req, 1024);
  } catch {
    reject(res);
    return;
  }

  try {
    const expireTime = new Date(Date.now() + LIVE_TOKEN_TTL_MS).toISOString();
    const newSessionExpireTime = new Date(Date.now() + LIVE_NEW_SESSION_TTL_MS).toISOString();
    const issued = await ai.authTokens.create({
      config: {
        uses: LIVE_TOKEN_USES,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: liveConnectConfig,
        },
      },
    });
    if (!issued.name) {
      sendJson(res, 502, { error: "Could not start the live session." });
      return;
    }
    sendJson(res, 200, { token: issued.name });
  } catch {
    sendJson(res, 502, { error: "Could not start the live session." });
  }
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
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "The request was rejected." });
      return;
    }

    const handlers: Record<string, (req: IncomingMessage, res: ServerResponse, apiKey: string) => Promise<void>> = {
      "/api/gemini/stream": handleStream,
      "/api/gemini/image": handleImage,
      "/api/gemini/json": handleJson,
      "/api/gemini/live-token": handleLiveToken,
    };
    const handler = handlers[path];
    if (!handler) {
      sendJson(res, 404, { error: "The request was rejected." });
      return;
    }

    void handler(req, res, apiKey).catch(() => {
      if (!res.headersSent) sendJson(res, 500, { error: "The model request failed." });
      else res.end();
    });
  };
}
