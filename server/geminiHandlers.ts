/**
 * Web-standard Gemini API used by Cloudflare Pages Functions.
 * The Vite middleware adapts Node requests to this module for local development.
 * Import `@google/genai/web` only. The package's Node entry uses fs, node:stream, and ws.
 */
import { GoogleGenAI } from "@google/genai/web";
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

export const GENERATION_LIMIT = 30;
export const TOKEN_LIMIT = 6;

export type GeminiBucket = "generation" | "live-token";

const encoder = new TextEncoder();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(status: number, body: Record<string, unknown>, extra?: Record<string, string>): Response {
  const headers = new Headers(extra);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(body), { status, headers });
}

function rejected(): Response {
  return json(400, { error: "The request was rejected." });
}

function limited(): Response {
  return json(429, { error: "Too many requests. Try again shortly." }, { "Retry-After": "60" });
}

async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  if (!request.body) return {};
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("too_large");
    }
    chunks.push(value);
  }
  if (size === 0) return {};
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("invalid_json");
  }
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

function validateTextPart(part: Record<string, unknown>): { text: string } | null {
  if (typeof part.text !== "string") return null;
  if (Object.keys(part).length !== 1) return null;
  if (part.text.length > MAX_TEXT_CHARS) return null;
  return { text: part.text };
}

function validateInlinePart(
  part: Record<string, unknown>,
): { inlineData: { mimeType: string; data: string } } | null {
  if (!isRecord(part.inlineData)) return null;
  if (Object.keys(part).length !== 1) return null;
  const mimeType = part.inlineData.mimeType;
  const data = part.inlineData.data;
  if (typeof mimeType !== "string" || typeof data !== "string") return null;
  if (!/^image\/(png|jpeg|jpg|webp|gif)$/i.test(mimeType)) return null;
  if (data.length > MAX_INLINE_CHARS || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  return { inlineData: { mimeType, data } };
}

function validateContents(
  value: unknown,
): Array<{ role: "user" | "model"; parts: Array<Record<string, unknown>> }> | null {
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

function createClient(apiKey: string, apiVersion?: string): GoogleGenAI | null {
  const key = apiKey.trim();
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    ...(apiVersion ? { httpOptions: { apiVersion } } : {}),
  });
}

function sse(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

async function guard(
  allow: (bucket: GeminiBucket) => Promise<boolean>,
  bucket: GeminiBucket,
): Promise<Response | null> {
  try {
    const allowed = await allow(bucket);
    if (!allowed) return limited();
    return null;
  } catch {
    return json(503, { error: "The request limit is not configured." });
  }
}

async function handleStream(
  request: Request,
  apiKey: string,
  allow: (bucket: GeminiBucket) => Promise<boolean>,
): Promise<Response> {
  const blocked = await guard(allow, "generation");
  if (blocked) return blocked;
  const ai = createClient(apiKey);
  if (!ai) return json(503, { error: "The model service is not configured." });

  let body: unknown;
  try {
    body = await readJson(request, MAX_BODY_BYTES);
  } catch {
    return rejected();
  }
  if (!isRecord(body) || hasForbiddenKey(body)) return rejected();

  const model = body.model;
  const systemInstruction = body.systemInstruction ?? "";
  const budget = readBudget(body.thinkingBudget);
  const contents = validateContents(body.contents);
  if (typeof model !== "string" || !TEXT_MODELS.has(model)) return rejected();
  if (typeof systemInstruction !== "string" || systemInstruction.length > MAX_SYSTEM_CHARS) return rejected();
  if (budget === null || !contents) return rejected();
  if (budget != null && model !== "gemini-3-pro-preview") return rejected();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const generated = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            ...(budget != null ? { thinkingConfig: { thinkingBudget: budget } } : {}),
          },
        });
        let emitted = 0;
        for await (const chunk of generated) {
          if (request.signal.aborted) break;
          const text = typeof chunk.text === "string" ? chunk.text : "";
          if (!text) continue;
          const room = MAX_OUTPUT_CHARS - emitted;
          if (room <= 0) break;
          const slice = text.slice(0, room);
          emitted += slice.length;
          controller.enqueue(sse({ text: slice }));
        }
        controller.enqueue(sse({ done: true }));
      } catch {
        controller.enqueue(sse({ error: "The model request failed." }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function handleImage(
  request: Request,
  apiKey: string,
  allow: (bucket: GeminiBucket) => Promise<boolean>,
): Promise<Response> {
  const blocked = await guard(allow, "generation");
  if (blocked) return blocked;
  const ai = createClient(apiKey);
  if (!ai) return json(503, { error: "The model service is not configured." });

  let body: unknown;
  try {
    body = await readJson(request, 32_000);
  } catch {
    return rejected();
  }
  if (!isRecord(body) || typeof body.prompt !== "string") return rejected();
  const prompt = body.prompt.trim();
  if (!prompt || prompt.length > MAX_IMAGE_PROMPT_CHARS || Object.keys(body).some((key) => key !== "prompt")) {
    return rejected();
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
      return json(200, { image: `data:${inline.mimeType};base64,${inline.data}` });
    }
    return json(502, { error: "The model request failed." });
  } catch {
    return json(502, { error: "The model request failed." });
  }
}

async function handleJsonRoute(
  request: Request,
  apiKey: string,
  allow: (bucket: GeminiBucket) => Promise<boolean>,
): Promise<Response> {
  const blocked = await guard(allow, "generation");
  if (blocked) return blocked;
  const ai = createClient(apiKey);
  if (!ai) return json(503, { error: "The model service is not configured." });

  let body: unknown;
  try {
    body = await readJson(request, 64_000);
  } catch {
    return rejected();
  }
  if (!isRecord(body) || hasForbiddenKey(body)) return rejected();
  const model = body.model;
  const prompt = body.prompt;
  const schema = body.schema;
  if (typeof model !== "string" || !TEXT_MODELS.has(model)) return rejected();
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > MAX_TEXT_CHARS) return rejected();
  if (!isRecord(schema) || depthOf(schema) > MAX_SCHEMA_DEPTH) return rejected();
  const schemaText = JSON.stringify(schema);
  if (schemaText.length > MAX_SCHEMA_CHARS) return rejected();

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
      return json(502, { error: "The model request failed." });
    }
    return json(200, { result: JSON.parse(jsonText) });
  } catch {
    return json(502, { error: "The model request failed." });
  }
}

async function handleLiveToken(
  request: Request,
  apiKey: string,
  allow: (bucket: GeminiBucket) => Promise<boolean>,
): Promise<Response> {
  const blocked = await guard(allow, "live-token");
  if (blocked) return blocked;
  const ai = createClient(apiKey, "v1alpha");
  if (!ai) return json(503, { error: "The model service is not configured." });

  try {
    await readJson(request, 1024);
  } catch {
    return rejected();
  }

  try {
    const expireTime = new Date(Date.now() + LIVE_TOKEN_TTL_MS).toISOString();
    const newSessionExpireTime = new Date(Date.now() + LIVE_NEW_SESSION_TTL_MS).toISOString();
    const issued = await ai.authTokens.create({
      config: {
        httpOptions: { apiVersion: "v1alpha" },
        uses: LIVE_TOKEN_USES,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: liveConnectConfig,
        },
      },
    });
    if (!issued.name) return json(502, { error: "Could not start the live session." });
    return json(200, { token: issued.name });
  } catch {
    return json(502, { error: "Could not start the live session." });
  }
}

export async function handleGeminiRequest(
  request: Request,
  options: {
    apiKey: string;
    allow: (bucket: GeminiBucket) => Promise<boolean>;
  },
): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (request.method !== "POST") {
    return json(405, { error: "The request was rejected." });
  }

  const handlers: Record<string, typeof handleStream> = {
    "/api/gemini/stream": handleStream,
    "/api/gemini/image": handleImage,
    "/api/gemini/json": handleJsonRoute,
    "/api/gemini/live-token": handleLiveToken,
  };
  const handler = handlers[path];
  if (!handler) return json(404, { error: "The request was rejected." });

  try {
    return await handler(request, options.apiKey, options.allow);
  } catch {
    return json(500, { error: "The model request failed." });
  }
}
