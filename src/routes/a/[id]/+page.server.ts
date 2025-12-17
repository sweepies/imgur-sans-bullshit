import type { PageServerLoad } from './$types';
import { createR2Service } from '$lib/services/r2';
import { createD1Service } from '$lib/services/d1';
import { createImgurService } from '$lib/services/imgur';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, platform, setHeaders }) => {
	const { id } = params;
	
	if (!platform?.env) {
		throw error(500, 'Service not available');
	}
	
	const r2 = createR2Service(platform.env.R2_BUCKET);
	const d1 = createD1Service(platform.env.D1_DATABASE);
	const imgur = createImgurService(platform.env.IMGUR_CLIENT_ID);
	
	// Set cache headers
	setHeaders({
		'Cache-Control': 'public, max-age=600'
	});
	
	// Check if we have cached metadata
	let metadata = await d1.getAlbum(id);
	let imageIds = metadata ? await d1.getAlbumImages(id) : [];
	
	// If not cached or stale, fetch from Imgur
	if (!metadata || Date.now() - metadata.last_checked > 3600000) { // 1 hour
		const imgurAlbum = await imgur.getAlbum(id);
		
		if (!imgurAlbum) {
			// Mark as deleted if we had it cached
			if (metadata) {
				metadata.is_deleted = true;
				await d1.setAlbum(metadata);
			}
			throw error(404, 'Album not found');
		}
		
		// Cache all images
		imageIds = [];
		for (const [index, imgurImage] of imgurAlbum.images.entries()) {
			const imageData = await imgur.downloadImage(imgurImage.link);
			if (imageData) {
				await r2.put(imgurImage.id, imageData, {
					contentType: imgurImage.type,
				});
			}
			
			const imageMetadata = {
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
			await d1.setImage(imageMetadata);
			imageIds.push(imgurImage.id);
		}
		
		metadata = {
			id: imgurAlbum.id,
			title: imgurAlbum.title,
			description: imgurAlbum.description,
			images_count: imgurAlbum.images_count,
			cached_at: Date.now(),
			last_checked: Date.now(),
			is_deleted: false,
		};
		
		// Insert album first, then create relationships
		await d1.setAlbum(metadata);
		
		// Now add all album-image relationships
		for (let i = 0; i < imageIds.length; i++) {
			await d1.addAlbumImage(id, imageIds[i], i);
		}
	}
	
	// Get all image metadata
	const images = [];
	for (const imageId of imageIds) {
		const imgMeta = await d1.getImage(imageId);
		if (imgMeta && !imgMeta.is_deleted) {
			images.push(imgMeta);
		}
	}
	
	return {
		album: metadata,
		images,
		imageIds
	};
};
