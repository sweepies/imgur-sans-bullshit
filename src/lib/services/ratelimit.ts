export interface RateLimitConfig {
	windowMs: number; // 15 minutes = 900000ms
	maxRequests: number; // 100 requests
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number;
}

export function createRateLimitService(db: D1Database, config: RateLimitConfig) {
	return {
		async checkLimit(ip: string, endpoint: string): Promise<RateLimitResult> {
			const now = Date.now();
			const windowStart = now - (now % config.windowMs);

			// Get current count
			const row = await db
				.prepare(
					'SELECT count FROM rate_limits WHERE ip = ? AND endpoint = ? AND window_start = ?'
				)
				.bind(ip, endpoint, windowStart)
				.first<{ count: number }>();

			const currentCount = row?.count || 0;

			if (currentCount >= config.maxRequests) {
				return {
					allowed: false,
					remaining: 0,
					resetAt: windowStart + config.windowMs
				};
			}

			// Increment counter (upsert)
			await db
				.prepare(
					`
        INSERT INTO rate_limits (ip, endpoint, window_start, count)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(ip, endpoint, window_start)
        DO UPDATE SET count = count + 1
      `
				)
				.bind(ip, endpoint, windowStart)
				.run();

			return {
				allowed: true,
				remaining: config.maxRequests - currentCount - 1,
				resetAt: windowStart + config.windowMs
			};
		}
	};
}
