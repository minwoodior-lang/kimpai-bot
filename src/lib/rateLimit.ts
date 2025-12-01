interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const bucketMap = new Map<string, TokenBucket>();

const MAX_TOKENS = 10;
const REFILL_RATE = 2;
const REFILL_INTERVAL_MS = 2000;

setInterval(() => {
  const now = Date.now();
  const entries = Array.from(bucketMap.entries());
  entries.forEach(([key, bucket]) => {
    if (now - bucket.lastRefill > 60000) {
      bucketMap.delete(key);
    }
  });
}, 60000);

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let bucket = bucketMap.get(ip);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS - 1, lastRefill: now };
    bucketMap.set(ip, bucket);
    return { allowed: true };
  }

  const elapsed = now - bucket.lastRefill;
  const refillCount = Math.floor(elapsed / REFILL_INTERVAL_MS) * REFILL_RATE;
  
  if (refillCount > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refillCount);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true };
  }

  const nextRefillIn = REFILL_INTERVAL_MS - (elapsed % REFILL_INTERVAL_MS);
  const retryAfter = Math.ceil(nextRefillIn / 1000);
  return { allowed: false, retryAfter };
}

export function getClientIp(req: { headers: { [key: string]: string | string[] | undefined }; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ip.trim();
  }
  
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return req.socket?.remoteAddress || "unknown";
}
