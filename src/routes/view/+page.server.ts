import type { ServerLoadEvent } from '@sveltejs/kit';
import { createHostManager } from '$lib/hosts/manager';
import { createD1Service, type ImageMetadata } from '$lib/services/d1';
import { createR2Service } from '$lib/services/r2';
import type { HostAlbum, HostImage } from '$lib/hosts/types';
import { error, redirect } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/middleware/ratelimit';

function newId(prefix: 'g' | 'i') {
	return `${prefix}_${crypto.randomUUID()}`;
}

export const load = async (event: ServerLoadEvent) => {
	const { url, platform, setHeaders, request } = event;
	if (!platform?.env) {
		throw error(500, 'Service not available');
	}

	await checkRateLimit(request, platform, 'view');

	const target = url.searchParams.get('url');
	if (!target || target.trim() === '') {
		redirect(303, '/');
	}

	const hostManager = createHostManager(platform.env);
	const parsed = hostManager.resolveInput(target);
	if (!parsed) {
		throw error(400, 'Unsupported URL or ID format');
	}

	const plugin = hostManager.getPlugin(parsed.pluginId) ?? hostManager.defaultPlugin;
	const d1 = createD1Service(platform.env.D1_DATABASE);
	const r2 = createR2Service(platform.env.R2_BUCKET);

	setHeaders({
		'Cache-Control': `public, max-age=${plugin.config.pageCacheSeconds}`
	});

	try {
		// Check for existing gallery/image by provider to avoid re-ingestion
		const existingGallery = await d1.getGalleryByProvider(plugin.providerId, parsed.resourceId);
		if (existingGallery && !existingGallery.is_deleted) {
			const imageIds = await d1.getGalleryImages(existingGallery.id);
			const images = (
				await Promise.all(imageIds.map((imageId) => d1.getImage(imageId)))
			).filter((img): img is NonNullable<typeof img> => !!img && !img.is_deleted);

			return {
				album: existingGallery,
				images,
				imageIds: images.map((img) => img.id)
			};
		}

		const existingImage = await d1.getImageByProvider(plugin.providerId, parsed.resourceId);
		if (existingImage && !existingImage.is_deleted) {
			return {
				album: null,
				images: [existingImage],
				imageIds: [existingImage.id]
			};
		}

		// Persist a single image and return metadata with the new local ID
		const persistImage = async (img: HostImage) => {
			const existing = await d1.getImageByProvider(plugin.providerId, img.id);
			if (existing && !existing.is_deleted) {
				return existing;
			}

			const imageId = newId('i');
			const data = await plugin.download(img.url);
			if (data) {
				await r2.put(imageId, data, { contentType: img.type });
			}
			const metadata = {
				id: imageId,
				url: img.url,
				source_url: img.source_url || img.url,
				provider_id: plugin.providerId,
				provider_image_id: img.id,
				title: img.title,
				description: img.description,
				type: img.type,
				width: img.width,
				height: img.height,
				size: img.size,
				cached_at: Date.now(),
				last_checked: Date.now(),
				is_deleted: false
			};
			await d1.setImage(metadata);
			return metadata;
		};

		// Attempt to fetch via gallery-aware API
		const gallery = plugin.fetchGallery ? await plugin.fetchGallery(parsed.resourceId) : null;
		if (gallery?.isAlbum) {
			const album = gallery.data as HostAlbum;
			const galleryId = newId('g');

			// Create gallery record first (required for foreign key constraint)
			const galleryMeta = {
				id: galleryId,
				provider_id: plugin.providerId,
				provider_gallery_id: parsed.resourceId,
				source_url: album.source_url ?? target,
				title: album.title,
				description: album.description,
				images_count: album.images_count ?? album.images?.length ?? 0,
				cached_at: Date.now(),
				last_checked: Date.now(),
				is_deleted: false
			};

			await d1.setGallery(galleryMeta);

			// Now add images (gallery must exist first for foreign key constraint)
			const images: ImageMetadata[] = [];

			for (const [idx, img] of (album.images || []).entries()) {
				const meta = await persistImage(img);
				images.push(meta);
				await d1.addGalleryImage(galleryId, meta.id, idx);
			}

			return {
				album: galleryMeta,
				images,
				imageIds: images.map((m) => m.id)
			};
		}

		// Fallback: treat as single image
		const image =
			gallery?.data && !gallery.isAlbum ? (gallery.data as HostImage) : await plugin.fetchImage(parsed.resourceId);
		if (!image) {
			throw error(404, 'Content not found or has been deleted');
		}

		const meta = await persistImage(image);
		return {
			album: null,
			images: [meta],
			imageIds: [meta.id]
		};
	} catch (err) {
		// If it's already a SvelteKit error (400, 404), re-throw it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		// For all other errors (network issues, API failures, etc.), show user-friendly error
		console.error('Error fetching content:', err);
		throw error(404, 'Unable to load content. The image or gallery may not exist, be private, or the provider may be unavailable.');
	}
};
