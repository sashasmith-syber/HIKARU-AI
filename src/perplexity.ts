/**
 * src/services/perplexity.ts
 * HIKARU-AI × Perplexity Sonar Integration
 *
 * Tier routing:  free → sonar | pro → sonar-pro | enterprise → sonar-deep-research
 * Security:      domain allowlisting, input sanitization, key rotation support
 * Observability: structured logging, latency + cost tracking to Supabase
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiTier = 'free' | 'pro' | 'enterprise';

export type SonarModel =
  | 'sonar'
  | 'sonar-pro'
  | 'sonar-reasoning-pro'
  | 'sonar-deep-research';

export interface PerplexityConfig {
  apiKey: string;
  baseUrl?: string;
  defaultDomainAllowlist?: string[];  // enforce on free tier
  maxInputLength?: number;
}

export interface SonarRequest {
  query: string;
  model?: SonarModel;
  tier: ApiTier;
  recency?: 'hour' | 'day' | 'week' | 'month';
  domainFilter?: string[];
  systemPrompt?: string;       // HIKARU persona context injection
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface SonarCitation {
  url: string;
  title?: string;
  snippet?: string;
}

export interface SonarResponse {
  content: string;
  model: SonarModel;
  citations: SonarCitation[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    searchUnits?: number;
  };
  latencyMs: number;
  estimatedCostUsd: number;
}

// ─── Cost table (USD per 1M tokens, as of April 2026) ─────────────────────────
const SONAR_COST: Record<SonarModel, { input: number; output: number }> = {
  'sonar':                { input: 1.00,  output: 1.00  },
  'sonar-pro':            { input: 3.00,  output: 15.00 },
  'sonar-reasoning-pro':  { input: 2.00,  output: 8.00  },
  'sonar-deep-research':  { input: 2.00,  output: 8.00  },
};

// ─── Tier → Model routing ────────────────────────────────────────────────────
const TIER_MODEL_MAP: Record<ApiTier, SonarModel> = {
  free:       'sonar',
  pro:        'sonar-pro',
  enterprise: 'sonar-deep-research',
};

// Default domain allowlist for FREE tier (prevents abuse)
const FREE_TIER_DOMAIN_ALLOWLIST = [
  'wikipedia.org',
  'github.com',
  'arxiv.org',
  'stackoverflow.com',
  'developer.mozilla.org',
  'docs.python.org',
  'npmjs.com',
];

// ─── Input sanitization ───────────────────────────────────────────────────────

function sanitizeQuery(query: string, maxLength = 4000): string {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    throw new Error('Query cannot be empty after trimming');
  }

  if (trimmed.length > maxLength) {
    throw new Error(`Query exceeds maximum length of ${maxLength} characters`);
  }

  // Strip potential prompt injection attempts (basic guard)
  const injectionPatterns = [
    /ignore (all )?previous instructions/gi,
    /system:\s*you are now/gi,
    /<\|im_start\|>/gi,
    /\[INST\]/gi,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(trimmed)) {
      throw new Error('Query contains disallowed content');
    }
  }

  return trimmed;
}

function resolveDomainFilter(
  tier: ApiTier,
  requested?: string[],
  configAllowlist?: string[]
): string[] | undefined {
  if (tier === 'free') {
    // Free tier: enforce allowlist, ignore user-supplied domains
    return configAllowlist ?? FREE_TIER_DOMAIN_ALLOWLIST;
  }

  if (tier === 'pro' && requested && requested.length > 0) {
    // Pro: allow user domains but cap at 10
    return requested.slice(0, 10);
  }

  // Enterprise: full control
  return requested;
}

// ─── Cost estimation ─────────────────────────────────────────────────────────

function estimateCost(
  model: SonarModel,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = SONAR_COST[model];
  return (
    (promptTokens / 1_000_000) * rates.input +
    (completionTokens / 1_000_000) * rates.output
  );
}

// ─── Main service class ───────────────────────────────────────────────────────

export class PerplexityService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly maxInputLength: number;
  private readonly defaultDomainAllowlist?: string[];

  constructor(
    config: PerplexityConfig,
    private readonly supabase?: SupabaseClient
  ) {
    if (!config.apiKey) {
      throw new Error('Perplexity API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://api.perplexity.ai';
    this.maxInputLength = config.maxInputLength ?? 4000;
    this.defaultDomainAllowlist = config.defaultDomainAllowlist;
  }

  /**
   * Core search / grounded inference call.
   * Routes to the correct Sonar model based on tier,
   * applies domain filtering, and logs usage to Supabase.
   */
  async search(req: SonarRequest): Promise<SonarResponse> {
    const t0 = Date.now();

    // 1. Resolve model from tier (or use explicit override for pro/enterprise)
    const model: SonarModel =
      req.model && req.tier !== 'free'
        ? req.model
        : TIER_MODEL_MAP[req.tier];

    // 2. Sanitize input
    const safeQuery = sanitizeQuery(req.query, this.maxInputLength);

    // 3. Resolve domain filter
    const domainFilter = resolveDomainFilter(
      req.tier,
      req.domainFilter,
      this.defaultDomainAllowlist
    );

    // 4. Build Perplexity request (OpenAI-compatible)
    const messages = [];

    if (req.systemPrompt) {
      messages.push({ role: 'system', content: req.systemPrompt });
    }

    messages.push({ role: 'user', content: safeQuery });

    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.2,   // lower default for factual search
      stream: req.stream ?? false,
      return_citations: true,
      return_images: false,
    };

    if (req.recency) {
      body['search_recency_filter'] = req.recency;
    }

    if (domainFilter && domainFilter.length > 0) {
      body['search_domain_filter'] = domainFilter;
    }

    // 5. Execute request
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-HIKARU-Tier': req.tier,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(model === 'sonar-deep-research' ? 120_000 : 30_000),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => 'unknown error');
      throw new PerplexityError(
        `Sonar API error ${response.status}: ${errBody}`,
        response.status
      );
    }

    const data = await response.json() as PerplexityAPIResponse;
    const latencyMs = Date.now() - t0;

    // 6. Extract and normalize response
    const content = data.choices[0]?.message?.content ?? '';
    const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const citations = normalizeCitations(data.citations ?? []);
    const estimatedCostUsd = estimateCost(model, usage.prompt_tokens, usage.completion_tokens);

    const result: SonarResponse = {
      content,
      model,
      citations,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        searchUnits: usage.search_context_size ? 1 : undefined,
      },
      latencyMs,
      estimatedCostUsd,
    };

    // 7. Log to Supabase (non-blocking)
    this.logUsage(req.tier, model, result).catch(console.error);

    return result;
  }

  /**
   * Convenience: fact-check a specific claim.
   */
  async factCheck(
    claim: string,
    tier: ApiTier,
    context?: string
  ): Promise<{ verified: boolean; confidence: number; correctedClaim?: string; citations: SonarCitation[] }> {
    const systemPrompt = `You are a precise fact-checker. 
Evaluate the following claim for accuracy using current web sources.
Respond ONLY in this JSON structure (no markdown):
{
  "verified": boolean,
  "confidence": number (0-10),
  "corrected_claim": string | null,
  "reasoning": string (max 200 chars)
}`;

    const query = context
      ? `Claim: "${claim}"\nContext: ${context}`
      : `Claim: "${claim}"`;

    const res = await this.search({
      query,
      tier,
      systemPrompt,
      temperature: 0.1,
      maxTokens: 512,
    });

    try {
      const parsed = JSON.parse(res.content) as {
        verified: boolean;
        confidence: number;
        corrected_claim: string | null;
      };

      return {
        verified: parsed.verified,
        confidence: parsed.confidence,
        correctedClaim: parsed.corrected_claim ?? undefined,
        citations: res.citations,
      };
    } catch {
      // Fallback: return raw with low confidence
      return {
        verified: false,
        confidence: 5.0,
        citations: res.citations,
      };
    }
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async logUsage(
    tier: ApiTier,
    model: SonarModel,
    res: SonarResponse
  ): Promise<void> {
    if (!this.supabase) return;

    await this.supabase.from('perplexity_usage').insert({
      tier,
      model,
      prompt_tokens: res.usage.promptTokens,
      completion_tokens: res.usage.completionTokens,
      estimated_cost_usd: res.estimatedCostUsd,
      latency_ms: res.latencyMs,
      created_at: new Date().toISOString(),
    });
  }
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class PerplexityError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'PerplexityError';
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeCitations(raw: unknown[]): SonarCitation[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((c) => {
    if (typeof c === 'string') return { url: c };
    const obj = c as Record<string, unknown>;
    return {
      url: String(obj.url ?? obj.link ?? ''),
      title: obj.title ? String(obj.title) : undefined,
      snippet: obj.snippet ? String(obj.snippet) : undefined,
    };
  }).filter((c) => c.url);
}

// ─── Raw API response shape (Perplexity mirrors OpenAI) ───────────────────────

interface PerplexityAPIResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    search_context_size?: string;
  };
  citations?: unknown[];
}

// ─── Singleton factory ────────────────────────────────────────────────────────

let _instance: PerplexityService | null = null;

export function getPerplexityService(supabase?: SupabaseClient): PerplexityService {
  if (!_instance) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }

    _instance = new PerplexityService({ apiKey }, supabase);
  }

  return _instance;
}
