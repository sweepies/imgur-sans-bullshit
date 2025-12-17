import type { RequestHandler } from './$types';
import { createR2Service } from '$lib/services/r2';
import { createD1Service } from '$lib/services/d1';
import { createImgurService } from '$lib/services/imgur';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, platform, setHeaders }) => {
	const { id } = params;
	
	if (!platform?.env) {
		throw error(500, 'Service not available');
	}
	
	// Set cache headers
	setHeaders({
		'Cache-Control': 'public, max-age=3600'
	});
	
	const r2 = createR2Service(platform.env.R2_BUCKET);
	const d1 = createD1Service(platform.env.D1_DATABASE);
	const imgur = createImgurService(platform.env.IMGUR_CLIENT_ID);
	
	// Check if this is an album/gallery ID first
	let albumMetadata = await d1.getAlbum(id);
	let actualImageId = id;
	
	// If it's an album, get the first image ID
	if (albumMetadata) {
		const imageIds = await d1.getAlbumImages(id);
		if (imageIds.length === 0) {
			throw error(404, 'No images found in album');
		}
		actualImageId = imageIds[0];
	}
	
	// Check metadata first to see if we need to validate with Imgur
	let metadata = await d1.getImage(actualImageId);
	let image = await r2.get(actualImageId);
	
	// If not cached or stale, fetch from Imgur
	if (!image || !metadata || Date.now() - metadata.last_checked > 3600000) { // 1 hour
		const imgurImage = await imgur.getImage(actualImageId);
		
		if (!imgurImage) {
			// Mark as deleted if we had it cached
			if (metadata) {
				metadata.is_deleted = true;
				await d1.setImage(metadata);
				await r2.delete(actualImageId);
			}
			throw error(404, 'Image not found');
		}
		
		// Download and cache the image
		const imageData = await imgur.downloadImage(imgurImage.link);
		if (imageData) {
			await r2.put(actualImageId, imageData, {
				contentType: imgurImage.type,
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
		
		image = await r2.get(actualImageId);
	}
	
	if (!image) {
		throw error(404, 'Image not found');
	}
	
	return new Response(image.body, {
		headers: {
			'Content-Type': image.headers.get('Content-Type') || 'image/jpeg',
			'Content-Length': image.headers.get('Content-Length') || '',
			'ETag': image.headers.get('ETag') || '',
			'Last-Modified': image.headers.get('Last-Modified') || '',
		}
	});
};
