/**
 * Simple in-memory rate limiter for login/registration endpoints.
 * Tracks attempts per key (typically IP address) with a sliding window.
 * Resets on process restart — acceptable for a small team tool on Vercel Functions.
 */

const attempts = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_ATTEMPTS = 10;

export function checkRateLimit(
  key: string,
  options?: { windowMs?: number; maxAttempts?: number },
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const now = Date.now();

  const entry = attempts.get(key);

  if (!entry || now >= entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  entry.count += 1;

  if (entry.count > maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return { allowed: true, remaining: maxAttempts - entry.count, retryAfterMs: 0 };
}

// Periodic cleanup to prevent memory leak (runs at most every 5 minutes)
let lastCleanup = Date.now();

export function cleanupExpiredEntries() {
  const now = Date.now();

  if (now - lastCleanup < 5 * 60 * 1000) {
    return;
  }

  lastCleanup = now;

  for (const [key, entry] of attempts) {
    if (now >= entry.resetAt) {
      attempts.delete(key);
    }
  }
}
