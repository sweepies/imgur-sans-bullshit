import { error } from '@sveltejs/kit';
import { createRateLimitService } from '$lib/services/ratelimit';

const CONFIG = {
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 100
};

export async function checkRateLimit(
	request: Request,
	platform: App.Platform,
	endpoint: string
): Promise<void> {
	const ip =
		request.headers.get('CF-Connecting-IP') ||
		request.headers.get('X-Forwarded-For') ||
		'unknown';

	const limiter = createRateLimitService(platform.env.D1_DATABASE, CONFIG);
	const result = await limiter.checkLimit(ip, endpoint);

	if (!result.allowed) {
		const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
		throw error(429, {
			message: `Too many requests. Retry after ${retryAfter} seconds`,
			retryAfter
		});
	}
}
