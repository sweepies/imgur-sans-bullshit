import type { HostAlbum, HostImage, HostPlugin, ParsedInput } from '../types';

const POSTIMG_PAGE_REGEX = /postimg\.cc\/(?!gallery\/)([A-Za-z0-9]+)/i;
const POSTIMG_GALLERY_REGEX = /postimg\.cc\/gallery\/([A-Za-z0-9]+)/i;
const POSTIMG_DIRECT_REGEX = /i\.postimg\.cc\/([^?#\s]+)/i;

function cleanTitle(title?: string): string | undefined {
	if (!title) return undefined;
	return title.replace(/\s*[–—-]\s*Postimages?$/i, '').trim();
}

function guessMimeType(url: string): string {
	const match = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|mp4|mov|webm)(?:$|\?)/);
	if (!match) return 'application/octet-stream';
	const ext = match[1];
	if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
	if (ext === 'png') return 'image/png';
	if (ext === 'gif') return 'image/gif';
	if (ext === 'webp') return 'image/webp';
	if (ext === 'bmp') return 'image/bmp';
	if (ext === 'tiff') return 'image/tiff';
	if (ext === 'mp4') return 'video/mp4';
	if (ext === 'webm') return 'video/webm';
	if (ext === 'mov') return 'video/quicktime';
	return 'application/octet-stream';
}

function extractMeta(html: string, property: string): string | null {
	const regex = new RegExp(`<meta[^>]+${property}[^>]+content=["']([^"']+)["']`, 'i');
	const match = html.match(regex);
	return match?.[1] ?? null;
}

function extractTitle(html: string): string | undefined {
	const ogTitle = extractMeta(html, 'property=["\']og:title["\']');
	if (ogTitle) return ogTitle;
	const titleTag = html.match(/<title>([^<]+)<\/title>/i);
	return titleTag?.[1]?.trim();
}

async function fetchText(url: string): Promise<string | null> {
	try {
		const res = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; ImgurSansBS/1.0)'
			}
		});
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

async function resolveImageFromPage(pageId: string): Promise<HostImage | null> {
	const html = await fetchText(`https://postimg.cc/${pageId}`);
	if (!html) return null;

	// Prefer og:image
	const ogImage = extractMeta(html, 'property=["\']og:image["\']') ?? extractMeta(html, 'name=["\']og:image["\']');
	const imageUrl = ogImage || null;

	if (!imageUrl) return null;

	const title = cleanTitle(extractTitle(html));
	const type = guessMimeType(imageUrl);

	return {
		id: pageId,
		url: imageUrl,
		source_url: `https://postimg.cc/${pageId}`,
		title,
		description: undefined,
		type
	};
}

async function resolveImageFromDirect(path: string): Promise<HostImage | null> {
	const imageUrl = path.startsWith('http') ? path : `https://i.postimg.cc/${path.replace(/^\/+/, '')}`;
	const type = guessMimeType(imageUrl);
	return {
		id: path,
		url: imageUrl,
		source_url: imageUrl,
		type
	};
}

async function resolveAlbumFromGallery(galleryId: string): Promise<HostAlbum | null> {
	const html = await fetchText(`https://postimg.cc/gallery/${galleryId}`);
	if (!html) return null;

	const linkMatches = Array.from(html.matchAll(/https?:\/\/postimg\.cc\/([A-Za-z0-9]+)/g));
	const pageIds = Array.from(new Set(linkMatches.map((m) => m[1])));

	const images: HostImage[] = [];
	for (const pageId of pageIds) {
		const image = await resolveImageFromPage(pageId);
		if (image) {
			images.push({ ...image, id: pageId });
		}
	}

	return {
		id: galleryId,
		source_url: `https://postimg.cc/gallery/${galleryId}`,
		title: cleanTitle(extractTitle(html)),
		description: undefined,
		images_count: images.length,
		images
	};
}

export function createPostImagesPlugin(): HostPlugin {
	return {
		id: 'postimages',
		providerId: 'postimages',
		name: 'Postimages',
		config: {
			staleAfterMs: 60 * 60 * 1000,
			pageCacheSeconds: 600,
			apiCacheSeconds: 300,
			rawCacheSeconds: 3600
		},
		matchInput(input: string) {
			return /postimg\.cc/i.test(input) || /i\.postimg\.cc/i.test(input);
		},
		parseInput(input: string): ParsedInput | null {
			const str = input.trim();

			// Gallery
			const galleryMatch = str.match(POSTIMG_GALLERY_REGEX);
			if (galleryMatch?.[1]) {
				const id = galleryMatch[1];
				return {
					pluginId: 'postimages',
					resourceId: `gallery:${id}`,
					publicId: `postimages:gallery:${id}`,
					typeHint: 'album'
				};
			}

			// Direct
			const directMatch = str.match(POSTIMG_DIRECT_REGEX);
			if (directMatch?.[1]) {
				const path = directMatch[1];
				return {
					pluginId: 'postimages',
					resourceId: `direct:${path}`,
					publicId: `postimages:direct:${path}`,
					typeHint: 'image'
				};
			}

			// Page
			const pageMatch = str.match(POSTIMG_PAGE_REGEX);
			if (pageMatch?.[1]) {
				const id = pageMatch[1];
				return {
					pluginId: 'postimages',
					resourceId: `page:${id}`,
					publicId: `postimages:page:${id}`,
					typeHint: 'image'
				};
			}

			// Bare id fallback (treat as page id)
			if (/^[A-Za-z0-9]+$/.test(str)) {
				return {
					pluginId: 'postimages',
					resourceId: `page:${str}`,
					publicId: `postimages:page:${str}`,
					typeHint: 'image'
				};
			}

			return null;
		},
		parsePublicId(publicId: string): ParsedInput | null {
			const match = publicId.match(/^postimages:(.+)$/);
			if (!match) return null;
			const rest = match[1];
			if (rest.startsWith('gallery:')) {
				const id = rest.slice('gallery:'.length);
				return {
					pluginId: 'postimages',
					resourceId: `gallery:${id}`,
					publicId,
					typeHint: 'album'
				};
			}
			if (rest.startsWith('direct:')) {
				const path = rest.slice('direct:'.length);
				return {
					pluginId: 'postimages',
					resourceId: `direct:${path}`,
					publicId,
					typeHint: 'image'
				};
			}
			if (rest.startsWith('page:')) {
				const id = rest.slice('page:'.length);
				return {
					pluginId: 'postimages',
					resourceId: `page:${id}`,
					publicId,
					typeHint: 'image'
				};
			}
			return null;
		},
		toPublicId(resourceId: string) {
			return `postimages:${resourceId}`;
		},
		cacheKey(resourceId: string) {
			return resourceId;
		},
		async fetchImage(resourceId: string): Promise<HostImage | null> {
			if (resourceId.startsWith('page:')) {
				const id = resourceId.slice('page:'.length);
				return resolveImageFromPage(id);
			}
			if (resourceId.startsWith('direct:')) {
				const path = resourceId.slice('direct:'.length);
				return resolveImageFromDirect(path);
			}
			// Unknown subtype; attempt page fallback
			return resolveImageFromPage(resourceId);
		},
		async fetchAlbum(resourceId: string): Promise<HostAlbum | null> {
			if (resourceId.startsWith('gallery:')) {
				const id = resourceId.slice('gallery:'.length);
				return resolveAlbumFromGallery(id);
			}
			return null;
		},
		async fetchGallery(resourceId: string) {
			if (resourceId.startsWith('gallery:')) {
				const id = resourceId.slice('gallery:'.length);
				const album = await resolveAlbumFromGallery(id);
				if (!album) return null;
				return { isAlbum: true, data: album };
			}
			const image = await this.fetchImage(resourceId);
			if (!image) return null;
			return { isAlbum: false, data: image };
		},
		async download(url: string): Promise<ArrayBuffer | null> {
			try {
				const res = await fetch(url, {
					headers: {
						'User-Agent': 'Mozilla/5.0 (compatible; ImgurSansBS/1.0)'
					}
				});
				if (!res.ok) return null;
				return await res.arrayBuffer();
			} catch {
				return null;
			}
		}
	};
}
