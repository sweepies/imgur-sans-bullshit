import type { RequestHandler } from './$types';
import { createR2Service } from '$lib/services/r2';
import { createD1Service } from '$lib/services/d1';
import { createImgurService } from '$lib/services/imgur';
import { createRateLimit } from '$lib/middleware/rateLimit';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, platform, getClientAddress, setHeaders }) => {
	const { id } = params;
	
	if (!platform?.env) {
		throw error(500, 'Service not available');
	}
	
	// Apply rate limiting
	const rateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 100 });
	const clientAddress = getClientAddress();
	const rateLimitResult = rateLimit(clientAddress);
	
	if (!rateLimitResult.allowed) {
		setHeaders({
			'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
			'X-RateLimit-Limit': '100',
			'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
			'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
		});
		throw error(429, 'Too many requests');
	}
	
	setHeaders({
		'X-RateLimit-Limit': '100',
		'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
		'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
	});
	
	const d1 = createD1Service(platform.env.D1_DATABASE);
	const r2 = createR2Service(platform.env.R2_BUCKET);
	const imgur = createImgurService(platform.env.IMGUR_CLIENT_ID);
	
	let metadata = await d1.getImage(id);
	
	// Fetch if not cached or stale
	if (!metadata || Date.now() - metadata.last_checked > 3600000) {
		const imgurImage = await imgur.getImage(id);
		
		if (!imgurImage) {
			throw error(404, 'Image not found');
		}
		
		// Cache the image
		const imageData = await imgur.downloadImage(imgurImage.link);
		if (imageData) {
			await r2.put(id, imageData, {
				contentType: imgurImage.type,
			});
		}
		
		metadata = {
			id: imgurImage.id,
			url: imgurImage.link,
			title: imgurImage.title,
			description: imgurImage.description,
			type: imgurImage.type,
			width: imgurImage.width,
			height: imgurImage.height,
			size: imgurImage.size,
			cached_at: Date.now(),
			last_checked: Date.now(),
			is_deleted: false,
		};
		
		await d1.setImage(metadata);
	}
	
	return new Response(JSON.stringify(metadata), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=300'
		}
	});
};
