interface RateLimitRecord {
  timestamp: number;
  count: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const RATE_LIMIT_WINDOW_MS = 2000;
const RATE_LIMIT_MAX_REQUESTS = 2;

setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitMap.entries());
  entries.forEach(([key, record]) => {
    if (now - record.timestamp > RATE_LIMIT_WINDOW_MS * 10) {
      rateLimitMap.delete(key);
    }
  });
}, 60000);

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { timestamp: now, count: 1 });
    return { allowed: true };
  }

  const elapsed = now - record.timestamp;

  if (elapsed >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { timestamp: now, count: 1 });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - elapsed) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
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
