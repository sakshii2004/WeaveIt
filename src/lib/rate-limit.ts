interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * In-memory sliding-window rate limiter per PRD §8.1
 */
export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: limit - 1,
      resetAt,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Reset rate limit store (for unit tests)
 */
export function _resetRateLimitStore(): void {
  rateLimitStore.clear();
}
