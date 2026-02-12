import type { RateLimitResult } from "@/types";

export type { RateLimitResult };

/**
 * In-memory sliding window rate limiter.
 *
 * Tracks request timestamps per identifier (typically an IP address) and
 * enforces a maximum number of requests within a rolling time window.
 *
 * NOTE: This is suitable for single-process deployments. For multi-instance
 * deployments, replace with a Redis-based limiter (e.g., @upstash/ratelimit).
 */

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window. Default: 30 */
  maxRequests: number;
  /** Window size in milliseconds. Default: 60_000 (60 seconds) */
  windowMs: number;
}

const DEFAULT_OPTIONS: RateLimiterOptions = {
  maxRequests: 30,
  windowMs: 60_000,
};

/** Map of identifier -> array of request timestamps (ms) */
const requestLog = new Map<string, number[]>();

/**
 * Periodically clean up stale entries to prevent memory leaks.
 * Runs every 5 minutes and removes identifiers with no recent requests.
 */
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanupRunning(windowMs: number): void {
  if (cleanupInterval !== null) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requestLog.entries()) {
      const recent = timestamps.filter((t) => now - t < windowMs);
      if (recent.length === 0) {
        requestLog.delete(key);
      } else {
        requestLog.set(key, recent);
      }
    }
  }, 5 * 60 * 1000);

  // Allow the Node.js process to exit even if this interval is still running
  if (
    cleanupInterval &&
    typeof cleanupInterval === "object" &&
    "unref" in cleanupInterval
  ) {
    cleanupInterval.unref();
  }
}

/**
 * Check whether a request from the given identifier should be allowed.
 *
 * Uses a sliding window algorithm: stores individual request timestamps and
 * counts how many fall within the current window. This is more accurate than
 * fixed-window counters because it avoids burst-at-boundary issues.
 *
 * @param identifier - Unique identifier for the client (e.g., IP address)
 * @param options    - Optional overrides for maxRequests and windowMs
 * @returns          - { allowed: boolean, retryAfterMs: number }
 *
 * If allowed is false, retryAfterMs indicates how many milliseconds the caller
 * should wait before retrying (time until the oldest request in the window expires).
 */
export function checkRateLimit(
  identifier: string,
  options?: Partial<RateLimiterOptions>
): RateLimitResult {
  const { maxRequests, windowMs } = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();

  ensureCleanupRunning(windowMs);

  // Get existing timestamps or create a new array
  let timestamps = requestLog.get(identifier);
  if (!timestamps) {
    timestamps = [];
    requestLog.set(identifier, timestamps);
  }

  // Remove timestamps that are outside the current window
  const windowStart = now - windowMs;
  const recentTimestamps = timestamps.filter((t) => t > windowStart);
  requestLog.set(identifier, recentTimestamps);

  if (recentTimestamps.length >= maxRequests) {
    // Rate limit exceeded. Calculate when the oldest request in the window expires.
    const oldestInWindow = recentTimestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  // Request is allowed; record this timestamp
  recentTimestamps.push(now);
  return {
    allowed: true,
    retryAfterMs: 0,
  };
}

/**
 * Reset the rate limiter state for a specific identifier.
 * Useful for testing or manual overrides.
 */
export function resetRateLimit(identifier: string): void {
  requestLog.delete(identifier);
}

/**
 * Clear all rate limiter state.
 * Useful for testing.
 */
export function resetAllRateLimits(): void {
  requestLog.clear();
}
