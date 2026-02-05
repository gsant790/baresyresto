import { kv } from "@vercel/kv";

/**
 * Distributed Rate Limiter
 *
 * Uses Vercel KV (Redis) for rate limiting across serverless function instances.
 * Works reliably in Vercel's stateless environment, unlike in-memory solutions.
 *
 * In development, falls back gracefully if KV is unavailable.
 */

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier (IP, userId, etc.)
 * Uses Redis for distributed state across serverless instances
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const resetAt = now + windowMs;

  try {
    // Get current count
    const current = await kv.get<number>(key);

    if (current === null) {
      // First request in window
      await kv.set(key, 1, { ex: config.windowSec });
      return {
        success: true,
        remaining: config.limit - 1,
        resetAt,
      };
    }

    if (current >= config.limit) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetAt,
      };
    }

    // Increment count
    await kv.incr(key);

    return {
      success: true,
      remaining: config.limit - current - 1,
      resetAt,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open - allow request if Redis unavailable
    // This ensures service availability in case of KV failures
    return {
      success: true,
      remaining: config.limit,
      resetAt,
    };
  }
}

/**
 * Rate limit configs for different endpoints
 */
export const rateLimits = {
  // Public order creation: 5 orders per minute per IP
  createOrder: { limit: 5, windowSec: 60 },
  // Public menu view: 30 requests per minute per IP
  publicMenu: { limit: 30, windowSec: 60 },
  // Login attempts: 5 per minute per IP
  login: { limit: 5, windowSec: 60 },
} as const;
