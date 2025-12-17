import type { PageServerLoad } from './$types';
import { createR2Service } from '$lib/services/r2';
import { createD1Service } from '$lib/services/d1';
import { createImgurService } from '$lib/services/imgur';
import { createCacheService } from '$lib/services/cache';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, platform, setHeaders }) => {
	const { id } = params;
	
	if (!platform?.env) {
		throw error(500, 'Service not available');
	}
	
	const r2 = createR2Service(platform.env.R2_BUCKET);
	const d1 = createD1Service(platform.env.D1_DATABASE);
	const imgur = createImgurService(platform.env.IMGUR_CLIENT_ID);
	const cache = createCacheService();
	
	// Set cache headers
	setHeaders({
		'Cache-Control': 'public, max-age=600'
	});
	
	// Check if we have cached metadata
	let metadata = await d1.getImage(id);
	
	// If not cached or stale, fetch from Imgur
	if (!metadata || Date.now() - metadata.last_checked > 3600000) { // 1 hour
		const imgurImage = await imgur.getImage(id);
		
		if (!imgurImage) {
			// Mark as deleted if we had it cached
			if (metadata) {
				metadata.is_deleted = true;
				await d1.setImage(metadata);
				await r2.delete(id);
			}
			throw error(404, 'Image not found');
		}
		
		// Download and cache the image
		const imageData = await imgur.downloadImage(imgurImage.link);
		if (imageData) {
			await r2.put(id, imageData, {
				contentType: imgurImage.type,
				title: imgurImage.title || '',
				description: imgurImage.description || '',
			});
		}
		
		// Update metadata
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
	
	if (metadata.is_deleted) {
		throw error(404, 'Image not found');
	}
	
	return {
		image: metadata
	};
};
