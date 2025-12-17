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
	
	// Check if we have cached metadata (try album first, then image)
	let albumMetadata = await d1.getAlbum(id);
	let imageMetadata = albumMetadata ? null : await d1.getImage(id);
	let imageIds: string[] = [];
	
	// If not cached or stale, fetch from Imgur
	const isStale = albumMetadata ? Date.now() - albumMetadata.last_checked > 3600000 : 
	               imageMetadata ? Date.now() - imageMetadata.last_checked > 3600000 : true;
	
	if (!albumMetadata && !imageMetadata || isStale) {
		// Try gallery API first (handles both albums and single images)
		const gallery = await imgur.getGallery(id);
		
		if (gallery) {
			if (gallery.is_album) {
				// Handle as album
				const album = gallery.data as any;
				imageIds = [];
				
				// Cache all images
				for (const [index, imgurImage] of album.images.entries()) {
					const imageData = await imgur.downloadImage(imgurImage.link);
					if (imageData) {
						await r2.put(imgurImage.id, imageData, {
							contentType: imgurImage.type,
						});
					}
					
					const imageMeta = {
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
					await d1.setImage(imageMeta);
					imageIds.push(imgurImage.id);
				}
				
				albumMetadata = {
					id: album.id,
					title: album.title,
					description: album.description,
					images_count: album.images_count,
					cached_at: Date.now(),
					last_checked: Date.now(),
					is_deleted: false,
				};
				
				await d1.setAlbum(albumMetadata);
				for (let i = 0; i < imageIds.length; i++) {
					await d1.addAlbumImage(id, imageIds[i], i);
				}
			} else {
				// Handle as single image
				const image = gallery.data as any;
				const imageData = await imgur.downloadImage(image.link);
				if (imageData) {
					await r2.put(image.id, imageData, {
						contentType: image.type,
					});
				}
				
				imageMetadata = {
					id: image.id,
					url: image.link,
					title: image.title,
					description: image.description,
					type: image.type,
					width: image.width,
					height: image.height,
					size: image.size,
					cached_at: Date.now(),
					last_checked: Date.now(),
					is_deleted: false,
				};
				
				await d1.setImage(imageMetadata);
				imageIds = [image.id];
			}
		} else {
			// Try album API as fallback
			const album = await imgur.getAlbum(id);
			if (album) {
				// Same album handling as above...
				imageIds = [];
				for (const [index, imgurImage] of album.images.entries()) {
					const imageData = await imgur.downloadImage(imgurImage.link);
					if (imageData) {
						await r2.put(imgurImage.id, imageData, {
							contentType: imgurImage.type,
						});
					}
					
					const imageMeta = {
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
					await d1.setImage(imageMeta);
					imageIds.push(imgurImage.id);
				}
				
				albumMetadata = {
					id: album.id,
					title: album.title,
					description: album.description,
					images_count: album.images_count,
					cached_at: Date.now(),
					last_checked: Date.now(),
					is_deleted: false,
				};
				
				await d1.setAlbum(albumMetadata);
				for (let i = 0; i < imageIds.length; i++) {
					await d1.addAlbumImage(id, imageIds[i], i);
				}
			} else {
				// Try single image API as final fallback
				const image = await imgur.getImage(id);
				if (!image) {
					// Mark as deleted if we had it cached
					if (imageMetadata) {
						imageMetadata.is_deleted = true;
						await d1.setImage(imageMetadata);
						await r2.delete(id);
					}
					throw error(404, 'Content not found');
				}
				
				const imageData = await imgur.downloadImage(image.link);
				if (imageData) {
					await r2.put(id, imageData, {
						contentType: image.type,
					});
				}
				
				imageMetadata = {
					id: image.id,
					url: image.link,
					title: image.title,
					description: image.description,
					type: image.type,
					width: image.width,
					height: image.height,
					size: image.size,
					cached_at: Date.now(),
					last_checked: Date.now(),
					is_deleted: false,
				};
				
				await d1.setImage(imageMetadata);
				imageIds = [image.id];
			}
		}
	} else {
		// Get image IDs from cached album
		if (albumMetadata) {
			imageIds = await d1.getAlbumImages(id);
		} else if (imageMetadata) {
			imageIds = [imageMetadata.id];
		}
	}
	
	// Check if deleted
	if (albumMetadata?.is_deleted || imageMetadata?.is_deleted) {
		throw error(404, 'Content not found');
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
		album: albumMetadata,
		images,
		imageIds
	};
};
