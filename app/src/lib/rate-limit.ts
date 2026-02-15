// In-memory rate limiter (use Redis in production)
// Keyed by `${bucket}:${ip}` to separate limits per endpoint

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if a request is within the rate limit.
 * Returns true if allowed, false if rate limit exceeded.
 */
export function rateLimit(
  ip: string,
  bucket: string,
  limit: number,
  windowMs: number
): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
