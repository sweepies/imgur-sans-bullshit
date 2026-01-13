import { createImgurService } from '$lib/services/imgur';
import type { HostAlbum, HostImage, HostPlugin, HostResourceKind, ParsedInput } from '../types';

const IMGUR_API_BASE = 'https://api.imgur.com/3';
const IMGUR_CDN_BASE = 'https://i.imgur.com';

const imgurIdRegex = /^[a-zA-Z0-9]{4,10}$/;

function deriveTypeHintFromPath(path: string | undefined): HostResourceKind | undefined {
	if (!path) return undefined;
	if (path.startsWith('/a/') || path.startsWith('/album/') || path.startsWith('/gallery/')) {
		return 'album';
	}
	return undefined;
}

export function createImgurPlugin(clientId: string): HostPlugin {
	const service = createImgurService(clientId);

	return {
		id: 'imgur',
		providerId: 'imgur',
		name: 'Imgur',
		config: {
			staleAfterMs: 60 * 60 * 1000, // 1 hour
			pageCacheSeconds: 600,
			apiCacheSeconds: 300,
			rawCacheSeconds: 3600
		},
		matchInput(input: string) {
			return input.includes('imgur.com') || imgurIdRegex.test(input);
		},
		parseInput(input: string): ParsedInput | null {
			// Direct URL forms
			if (input.includes('imgur.com')) {
				try {
					const url = new URL(input.startsWith('http') ? input : `https://${input}`);
					const typeHint = deriveTypeHintFromPath(url.pathname);

					// Attempt to extract ID from common paths
					const match = url.pathname.match(
						/(?:\/a\/|\/album\/|\/gallery\/)?(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]{4,10})/
					);
					const id = match?.[1];
					if (!id) return null;

					return {
						pluginId: 'imgur',
						resourceId: id,
						publicId: id,
						typeHint
					};
				} catch {
					return null;
				}
			}

			// Bare ID
			if (imgurIdRegex.test(input)) {
				return {
					pluginId: 'imgur',
					resourceId: input,
					publicId: input
				};
			}

			return null;
		},
		parsePublicId(publicId: string): ParsedInput | null {
			// Accept prefixed form imgur:<id> as well as legacy bare IDs
			const prefixMatch = publicId.match(/^imgur:(.+)$/);
			if (prefixMatch) {
				const id = prefixMatch[1];
				return {
					pluginId: 'imgur',
					resourceId: id,
					publicId
				};
			}

			if (imgurIdRegex.test(publicId)) {
				return {
					pluginId: 'imgur',
					resourceId: publicId,
					publicId
				};
			}

			return null;
		},
		toPublicId(resourceId: string) {
			// Keep legacy URLs stable (no prefix) for Imgur
			return resourceId;
		},
		cacheKey(resourceId: string) {
			// Legacy-friendly: no prefix for Imgur. Other plugins may prefix.
			return resourceId;
		},
		async fetchImage(id: string): Promise<HostImage | null> {
			const image = await service.getImage(id);
			return image ? transformImage(image) : null;
		},
		async fetchAlbum(id: string): Promise<HostAlbum | null> {
			const album = await service.getAlbum(id);
			return album ? transformAlbum(album) : null;
		},
		async fetchGallery(id: string) {
			const gallery = await service.getGallery(id);
			if (!gallery) return null;
			if (gallery.is_album) {
				return { isAlbum: true, data: transformAlbum(gallery.data) };
			}
			return { isAlbum: false, data: transformImage(gallery.data) };
		},
		async download(url: string) {
			return service.downloadImage(url);
		}
	};
}

// Preserve transforms for the Imgur service API
export function transformImage(data: any): HostImage {
	return {
		id: data.id,
		source_url: data.link,
		title: data.title,
		description: data.description,
		type: data.type,
		width: data.width,
		height: data.height,
		size: data.size,
		url: data.link,
		animated: data.animated
	};
}

export function transformAlbum(data: any): HostAlbum {
	return {
		id: data.id,
		source_url: data.link || data.url,
		title: data.title,
		description: data.description,
		images_count: data.images_count || data.images?.length || 0,
		images: data.images?.map(transformImage) || []
	};
}
