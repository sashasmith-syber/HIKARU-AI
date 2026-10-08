import { handleGeminiRequest, type GeminiBucket } from "../../../server/geminiHandlers";

interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface GeminiEnv {
  GEMINI_API_KEY?: string;
  GEMINI_GENERATION_LIMIT?: RateLimitBinding;
  GEMINI_LIVE_TOKEN_LIMIT?: RateLimitBinding;
}

function bindingFor(env: GeminiEnv, bucket: GeminiBucket): RateLimitBinding | undefined {
  return bucket === "live-token" ? env.GEMINI_LIVE_TOKEN_LIMIT : env.GEMINI_GENERATION_LIMIT;
}

export async function onRequest(context: { request: Request; env: GeminiEnv }): Promise<Response> {
  const { request, env } = context;
  const actor = request.headers.get("CF-Connecting-IP") || "unknown";
  const response = await handleGeminiRequest(request, {
    apiKey: env.GEMINI_API_KEY ?? "",
    allow: async (bucket) => {
      const binding = bindingFor(env, bucket);
      if (!binding) throw new Error("limit_unconfigured");
      const result = await binding.limit({ key: actor });
      return result.success;
    },
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
