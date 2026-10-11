/**
 * HIKARU v3.6 Backend-for-Frontend (BFF) Worker
 * 
 * Security Controls:
 * - PREVIEW_AUTH_TOKEN: Bearer token authentication for private preview
 * - GEMINI_API_KEY: Stored server-side only, never exposed
 * - Rate limiting: Per-IP sliding window (10 req/min, 100 req/hour)
 * - Request validation and payload limits
 * - Controlled model allowlist
 * - Safe error responses (no credential leaks)
 * 
 * Authentication Flow:
 * 1. All /api/* endpoints (except /api/health) require Authorization header
 * 2. Format: "Authorization: Bearer <PREVIEW_AUTH_TOKEN>"
 * 3. Unauthorized requests are rejected BEFORE any Gemini API call
 * 4. Token is NOT embedded in frontend - users must obtain and provide it
 */

// Preview allowlist. Thinking and Efficiency IDs are intentionally absent.
const ALLOWED_MODELS = new Set([
  'gemini-3-flash-preview',
  'gemini-2.5-flash-image',
]);

// Payload limits
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_MESSAGE_COUNT = 100;
const MAX_TEXT_LENGTH = 100000;
const MAX_OUTPUT_TOKENS = 8192;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP
const RATE_LIMIT_HOUR_WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const RATE_LIMIT_HOUR_MAX_REQUESTS = 100; // 100 requests per hour per IP

// In-memory rate limit store (resets on Worker restart - acceptable for preview)
const rateLimitStore = new Map();

const getClientIP = (request) => {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
         'unknown';
};

const checkRateLimit = (clientIP) => {
  const now = Date.now();
  const key = `rate:${clientIP}`;
  
  let record = rateLimitStore.get(key);
  if (!record) {
    record = { minute: [], hour: [] };
    rateLimitStore.set(key, record);
  }
  
  // Clean old entries
  record.minute = record.minute.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  record.hour = record.hour.filter(ts => now - ts < RATE_LIMIT_HOUR_WINDOW_MS);
  
  // Check limits
  if (record.minute.length >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((record.minute[0] + RATE_LIMIT_WINDOW_MS - now) / 1000), limit: 'minute' };
  }
  if (record.hour.length >= RATE_LIMIT_HOUR_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((record.hour[0] + RATE_LIMIT_HOUR_WINDOW_MS - now) / 1000), limit: 'hour' };
  }
  
  // Record this request
  record.minute.push(now);
  record.hour.push(now);
  
  return { 
    allowed: true, 
    remaining: {
      minute: RATE_LIMIT_MAX_REQUESTS - record.minute.length,
      hour: RATE_LIMIT_HOUR_MAX_REQUESTS - record.hour.length,
    }
  };
};

const jsonResponse = (status, payload, headers = {}) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });

const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

const unauthorizedResponse = () => jsonResponse(401, {
  error: 'Unauthorized',
  code: 'AUTH_REQUIRED',
  message: 'Valid Authorization header required. Format: Bearer <token>',
});

const rateLimitResponse = (retryAfter, limit) => jsonResponse(429, {
  error: 'Rate limit exceeded',
  code: 'RATE_LIMITED',
  message: `Too many requests. Limit: ${limit === 'minute' ? '10/min' : '100/hour'}`,
}, {
  'Retry-After': String(retryAfter),
  'X-RateLimit-Limit': limit === 'minute' ? '10' : '100',
});

/**
 * Validate Authorization header against PREVIEW_AUTH_TOKEN
 * Returns true if authorized, false otherwise
 */
const validateAuth = (request, env) => {
  // Fail closed. A missing preview token never turns authentication off.
  if (!env.PREVIEW_AUTH_TOKEN) {
    return { valid: false, reason: 'Preview auth not configured' };
  }
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { valid: false, reason: 'No Authorization header' };
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { valid: false, reason: 'Invalid Authorization format' };
  }
  
  const token = parts[1];
  if (token !== env.PREVIEW_AUTH_TOKEN) {
    return { valid: false, reason: 'Invalid token' };
  }
  
  return { valid: true };
};

const parseJsonBody = async (request) => {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    throw new Error('Payload too large');
  }
  try {
    return await request.json();
  } catch {
    return null;
  }
};

const validateModel = (model) => {
  const normalized = typeof model === 'string' ? model.trim() : 'gemini-3-flash-preview';
  if (!ALLOWED_MODELS.has(normalized)) {
    // Return null to indicate invalid model - do NOT silently substitute
    return null;
  }
  return normalized;
};

const validateMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  if (messages.length > MAX_MESSAGE_COUNT) {
    return messages.slice(-MAX_MESSAGE_COUNT);
  }
  return messages;
};

const validateText = (text) => {
  if (typeof text !== 'string') return '';
  return text.slice(0, MAX_TEXT_LENGTH);
};

const safeError = (message) => ({
  error: message,
  code: 'API_ERROR',
});

const convertToGeminiParts = (parts) => {
  const geminiParts = [];
  for (const part of parts) {
    if (part.text) {
      geminiParts.push({ text: validateText(part.text) });
    } else if (part.inlineData) {
      geminiParts.push({
        inlineData: {
          mimeType: part.inlineData.mimeType || 'application/octet-stream',
          data: part.inlineData.data,
        },
      });
    }
  }
  return geminiParts;
};

const convertMessagesToContents = (messages) => {
  const contents = [];
  for (const msg of messages) {
    if (!msg || (msg.role !== 'user' && msg.role !== 'model')) continue;
    const parts = Array.isArray(msg.parts) ? convertToGeminiParts(msg.parts) : [];
    if (parts.length > 0) {
      contents.push({ role: msg.role, parts });
    }
  }
  return contents;
};

/**
 * POST /api/chat/stream
 * Streaming chat endpoint with SSE
 * Requires: Authorization, rate limit check
 */
const handleChatStream = async (request, env) => {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse(503, safeError('Backend not configured'));
  }

  const payload = await parseJsonBody(request);
  if (!payload) {
    return jsonResponse(400, safeError('Invalid JSON payload'));
  }

  const messages = validateMessages(payload.messages || []);
  const systemInstruction = validateText(payload.systemInstruction || '');
  const model = validateModel(payload.model);
  const config = payload.config || {};

  // Reject invalid model - do not silently substitute
  if (model === null) {
    return jsonResponse(400, safeError(`Invalid model. Allowed: ${[...ALLOWED_MODELS].join(', ')}`));
  }

  const contents = convertMessagesToContents(messages);
  if (contents.length === 0) {
    return jsonResponse(400, safeError('No valid messages provided'));
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}&alt=sse`;

  const requestBody = {
    contents,
    generationConfig: {
      temperature: typeof config.temperature === 'number' ? Math.max(0, Math.min(2, config.temperature)) : 0.7,
      topP: typeof config.topP === 'number' ? Math.max(0, Math.min(1, config.topP)) : 0.95,
      topK: typeof config.topK === 'number' ? Math.max(1, Math.min(100, config.topK)) : 64,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (config.thinkingConfig) {
    requestBody.generationConfig.thinkingConfig = {
      thinkingBudget: Math.min(config.thinkingConfig.thinkingBudget || 8192, 65536),
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return jsonResponse(response.status, safeError(errorData?.error?.message || 'Gemini API error'));
    }

    return new Response(response.body, {
      status: 200,
      headers: sseHeaders,
    });
  } catch (err) {
    return jsonResponse(500, safeError('Failed to connect to AI service'));
  }
};

/**
 * POST /api/chat
 * Non-streaming chat endpoint
 * Requires: Authorization, rate limit check
 */
const handleChat = async (request, env) => {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse(503, safeError('Backend not configured'));
  }

  const payload = await parseJsonBody(request);
  if (!payload) {
    return jsonResponse(400, safeError('Invalid JSON payload'));
  }

  const messages = validateMessages(payload.messages || []);
  const systemInstruction = validateText(payload.systemInstruction || '');
  const model = validateModel(payload.model);
  const config = payload.config || {};

  // Reject invalid model - do not silently substitute
  if (model === null) {
    return jsonResponse(400, safeError(`Invalid model. Allowed: ${[...ALLOWED_MODELS].join(', ')}`));
  }

  const contents = convertMessagesToContents(messages);
  if (contents.length === 0) {
    return jsonResponse(400, safeError('No valid messages provided'));
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const requestBody = {
    contents,
    generationConfig: {
      temperature: typeof config.temperature === 'number' ? Math.max(0, Math.min(2, config.temperature)) : 0.7,
      topP: typeof config.topP === 'number' ? Math.max(0, Math.min(1, config.topP)) : 0.95,
      topK: typeof config.topK === 'number' ? Math.max(1, Math.min(100, config.topK)) : 64,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (config.responseMimeType) {
    requestBody.generationConfig.responseMimeType = config.responseMimeType;
  }
  if (config.responseSchema) {
    requestBody.generationConfig.responseSchema = config.responseSchema;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      return jsonResponse(response.status, safeError(data?.error?.message || 'Gemini API error'));
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('') || '';

    return jsonResponse(200, { text, candidates: data.candidates });
  } catch (err) {
    return jsonResponse(500, safeError('Failed to connect to AI service'));
  }
};

/**
 * POST /api/image/generate
 * Image generation endpoint
 * Requires: Authorization, rate limit check
 */
const handleImageGenerate = async (request, env) => {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse(503, safeError('Backend not configured'));
  }

  const payload = await parseJsonBody(request);
  if (!payload) {
    return jsonResponse(400, safeError('Invalid JSON payload'));
  }

  const prompt = validateText(payload.prompt || '');
  if (!prompt) {
    return jsonResponse(400, safeError('Prompt is required'));
  }

  const model = 'gemini-2.5-flash-image';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return jsonResponse(response.status, safeError(data?.error?.message || 'Image generation failed'));
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return jsonResponse(200, {
          image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        });
      }
    }

    return jsonResponse(500, safeError('No image was generated'));
  } catch (err) {
    return jsonResponse(500, safeError('Failed to generate image'));
  }
};

/**
 * GET /api/health
 * Health check endpoint - NO auth required
 */
const handleHealth = (env) => {
  return jsonResponse(200, {
    status: 'ok',
    configured: !!env.GEMINI_API_KEY,
    authRequired: true,
    version: '3.6.0-bff',
  });
};

/**
 * GET /api/features
 * Feature availability endpoint - requires auth
 */
const handleFeatures = (env) => {
  return jsonResponse(200, {
    chat: true,
    chatStream: true,
    imageGeneration: true,
    jsonGeneration: true,
    liveAudio: false, // Not supported in BFF mode - requires WebSocket
    configured: !!env.GEMINI_API_KEY,
    limits: {
      rateLimit: {
        perMinute: RATE_LIMIT_MAX_REQUESTS,
        perHour: RATE_LIMIT_HOUR_MAX_REQUESTS,
      },
      maxPayloadBytes: MAX_PAYLOAD_SIZE,
      maxMessages: MAX_MESSAGE_COUNT,
      maxTextLength: MAX_TEXT_LENGTH,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
    allowedModels: [...ALLOWED_MODELS],
  });
};

// Endpoints that require authentication
const PROTECTED_ENDPOINTS = new Set([
  '/api/chat/stream',
  '/api/chat',
  '/api/image/generate',
  '/api/features',
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // CORS preflight - allow from anywhere but auth still required for actual requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Health check - NO auth required (allows monitoring)
    if (method === 'GET' && pathname === '/api/health') {
      return handleHealth(env);
    }

    // Check if this endpoint requires authentication
    if (PROTECTED_ENDPOINTS.has(pathname)) {
      // Validate authentication FIRST - before any other processing
      const authResult = validateAuth(request, env);
      if (!authResult.valid) {
        return unauthorizedResponse();
      }
      
      // Rate limiting - after auth, before Gemini call
      const clientIP = getClientIP(request);
      const rateResult = checkRateLimit(clientIP);
      if (!rateResult.allowed) {
        return rateLimitResponse(rateResult.retryAfter, rateResult.limit);
      }
    }

    // API routes (auth and rate limit already checked for protected endpoints)
    if (method === 'POST' && pathname === '/api/chat/stream') {
      return handleChatStream(request, env);
    }

    if (method === 'POST' && pathname === '/api/chat') {
      return handleChat(request, env);
    }

    if (method === 'POST' && pathname === '/api/image/generate') {
      return handleImageGenerate(request, env);
    }

    if (method === 'GET' && pathname === '/api/features') {
      return handleFeatures(env);
    }

    // Serve static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
