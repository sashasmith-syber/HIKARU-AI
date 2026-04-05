/**
 * src/middleware/auth.ts
 * HIKARU-AI API Key Auth + Tier Enforcement
 *
 * Three-tier model:
 *   free       → sonar only, 100 req/day, 50K tokens/month
 *   pro        → sonar-pro + reasoning, 5K req/day, 5M tokens/month
 *   enterprise → all models + custom personas + audit logs
 *
 * Keys stored in Supabase: table `api_keys`
 * Rate limit state: Supabase table `rate_limits` (or swap for Redis/Upstash)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiTier } from '../services/perplexity.js';

// ─── Config ───────────────────────────────────────────────────────────────────

export const TIER_LIMITS: Record<ApiTier, { requestsPerDay: number; tokensPerMonth: number }> = {
  free:       { requestsPerDay: 100,    tokensPerMonth: 50_000     },
  pro:        { requestsPerDay: 5_000,  tokensPerMonth: 5_000_000  },
  enterprise: { requestsPerDay: 100_000, tokensPerMonth: 500_000_000 },
};

// Endpoints restricted by tier
export const TIER_RESTRICTIONS: Record<string, ApiTier> = {
  '/v1/evaluate':    'pro',
  '/v1/audit/logs':  'enterprise',
  '/v1/personas':    'free',          // list only — create/update needs enterprise
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKeyRecord {
  id: string;
  key_hash: string;         // sha256(apiKey)
  tier: ApiTier;
  owner_id: string;
  name?: string;
  revoked: boolean;
  created_at: string;
  last_used_at?: string;
}

export interface AuthContext {
  keyId: string;
  ownerId: string;
  tier: ApiTier;
  keyPrefix: string;        // first 8 chars, safe for logging
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'missing_key' | 'invalid_key' | 'revoked_key' | 'tier_forbidden' | 'rate_limited',
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ─── Key hashing (Web Crypto — works in Edge runtime) ────────────────────────

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Auth middleware factory ──────────────────────────────────────────────────

export function createAuthMiddleware(supabase: SupabaseClient) {
  return async function authenticate(
    request: Request,
    path: string
  ): Promise<AuthContext> {
    // 1. Extract API key from header
    const apiKey =
      request.headers.get('X-API-Key') ??
      request.headers.get('Authorization')?.replace(/^Bearer\s+/, '');

    if (!apiKey) {
      throw new AuthError('API key required', 'missing_key', 401);
    }

    // 2. Lookup by hash (never store raw keys in DB)
    const keyHash = await hashApiKey(apiKey);

    const { data: keyRecord, error } = await supabase
      .from('api_keys')
      .select('id, tier, owner_id, name, revoked')
      .eq('key_hash', keyHash)
      .single();

    if (error || !keyRecord) {
      throw new AuthError('Invalid API key', 'invalid_key', 401);
    }

    if (keyRecord.revoked) {
      throw new AuthError('API key has been revoked', 'revoked_key', 401);
    }

    const ctx: AuthContext = {
      keyId: keyRecord.id,
      ownerId: keyRecord.owner_id,
      tier: keyRecord.tier as ApiTier,
      keyPrefix: apiKey.slice(0, 8),
    };

    // 3. Tier enforcement for restricted endpoints
    const requiredTier = TIER_RESTRICTIONS[path];
    if (requiredTier) {
      const tierOrder: ApiTier[] = ['free', 'pro', 'enterprise'];
      if (tierOrder.indexOf(ctx.tier) < tierOrder.indexOf(requiredTier)) {
        throw new AuthError(
          `This endpoint requires ${requiredTier} tier or above`,
          'tier_forbidden',
          403
        );
      }
    }

    // 4. Rate limit check
    await checkRateLimit(supabase, ctx);

    // 5. Update last_used_at (non-blocking)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', ctx.keyId)
      .then(() => {})
      .catch(console.error);

    return ctx;
  };
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

async function checkRateLimit(
  supabase: SupabaseClient,
  ctx: AuthContext
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);   // YYYY-MM-DD
  const { requestsPerDay } = TIER_LIMITS[ctx.tier];

  // Upsert counter
  const { data, error } = await supabase.rpc('increment_rate_limit', {
    p_owner_id: ctx.ownerId,
    p_date: today,
    p_limit: requestsPerDay,
  });

  if (error) {
    // Fail open on DB error to avoid blocking legitimate requests
    console.error('Rate limit check failed, failing open:', error.message);
    return;
  }

  if (data?.exceeded) {
    throw new AuthError(
      `Daily request limit of ${requestsPerDay} exceeded for ${ctx.tier} tier`,
      'rate_limited',
      429
    );
  }
}

// ─── Supabase SQL for rate limiting (run once in migration) ──────────────────
/*
-- table: api_keys
CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash     TEXT UNIQUE NOT NULL,
  tier         TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro','enterprise')),
  owner_id     UUID NOT NULL REFERENCES auth.users(id),
  name         TEXT,
  revoked      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);
CREATE INDEX api_keys_key_hash_idx ON api_keys (key_hash);

-- table: rate_limits
CREATE TABLE rate_limits (
  owner_id  UUID NOT NULL,
  date      DATE NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_id, date)
);

-- function: increment_rate_limit
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_owner_id UUID,
  p_date     DATE,
  p_limit    INTEGER
) RETURNS TABLE(exceeded BOOLEAN) AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO rate_limits (owner_id, date, count)
  VALUES (p_owner_id, p_date, 1)
  ON CONFLICT (owner_id, date)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO new_count;
  
  RETURN QUERY SELECT new_count > p_limit;
END;
$$ LANGUAGE plpgsql;
*/
