import { GENERATION_LIMIT, TOKEN_LIMIT, handleGeminiRequest, type GeminiBucket } from "../../../server/geminiHandlers";

interface LimitKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
}

interface GeminiEnv {
  GEMINI_API_KEY?: string;
  GEMINI_LIMITS?: LimitKv;
}

const WINDOW_MS = 60_000;

async function allow(env: GeminiEnv, bucket: GeminiBucket, actor: string): Promise<boolean> {
  const kv = env.GEMINI_LIMITS;
  if (!kv) throw new Error("limit_unconfigured");
  const limit = bucket === "live-token" ? TOKEN_LIMIT : GENERATION_LIMIT;
  const windowId = Math.floor(Date.now() / WINDOW_MS);
  const key = `${bucket}:${actor}:${windowId}`;
  const currentRaw = await kv.get(key);
  const current = currentRaw == null ? 0 : Number(currentRaw);
  if (!Number.isInteger(current)) throw new Error("limit_unconfigured");
  if (current >= limit) return false;
  await kv.put(key, String(current + 1), { expirationTtl: 120 });
  return true;
}

export async function onRequest(context: { request: Request; env: GeminiEnv }): Promise<Response> {
  const { request, env } = context;
  const actor = request.headers.get("CF-Connecting-IP") || "unknown";
  const response = await handleGeminiRequest(request, {
    apiKey: env.GEMINI_API_KEY ?? "",
    allow: (bucket) => allow(env, bucket, actor),
  });
  console.log(
    JSON.stringify({
      message: "gemini_request",
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
    }),
  );
  return response;
}
