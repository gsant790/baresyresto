/**
 * Simple Rate Limiter
 *
 * In-memory rate limiting for public endpoints.
 * For production, replace with Upstash Redis or similar.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (replace with Redis for multi-instance deployments)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const key = identifier;

  let entry = store.get(key);

  // Create new entry or reset expired one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  store.set(key, entry);

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    remaining,
    resetAt: entry.resetAt,
  };
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
