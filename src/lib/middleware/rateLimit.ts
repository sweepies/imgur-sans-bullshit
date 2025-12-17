interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory rate limit store (for Cloudflare Workers, this is per-instance)
const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function createRateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests } = options;
  
  return function rateLimit(clientAddress: string): RateLimitResult {
    const now = Date.now();
    const key = clientAddress || 'unknown';
    
    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }
    
    // Initialize or increment counter
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }
    
    const remaining = Math.max(0, maxRequests - store[key].count);
    const allowed = store[key].count <= maxRequests;
    
    return {
      allowed,
      remaining,
      resetTime: store[key].resetTime
    };
  };
}
