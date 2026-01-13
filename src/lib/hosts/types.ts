export type HostResourceKind = 'image' | 'album';

export interface HostImage {
	id: string;
	url: string;
	source_url?: string;
	title?: string;
	description?: string;
	type: string;
	width?: number;
	height?: number;
	size?: number;
	animated?: boolean;
}

export interface HostAlbum {
	id: string;
	source_url?: string;
	title?: string;
	description?: string;
	images_count: number;
	images: HostImage[];
}

export interface HostRateLimitConfig {
	windowMs: number;
	maxRequests: number;
}

export interface HostPluginConfig {
	/**
	 * How long before revalidating data with the upstream host.
	 */
	staleAfterMs: number;
	/**
	 * Cache-Control max-age for rendered pages.
	 */
	pageCacheSeconds: number;
	/**
	 * Cache-Control max-age for JSON APIs.
	 */
	apiCacheSeconds: number;
	/**
	 * Cache-Control max-age for raw binary responses.
	 */
	rawCacheSeconds: number;
	/**
	 * Optional rate limit overrides per plugin.
	 */
	rateLimit?: HostRateLimitConfig;
}

export interface ParsedInput {
	pluginId: string;
	resourceId: string;
	publicId: string;
	typeHint?: HostResourceKind;
}

export interface HostPlugin {
	id: string;
	providerId: string;
	name: string;
	config: HostPluginConfig;
	/**
	 * Quick test to see if the plugin likely handles the input (URL or ID).
	 */
	matchInput: (input: string) => boolean;
	/**
	 * Parse user input (URL or bare ID) into a resource identifier.
	 */
	parseInput: (input: string) => ParsedInput | null;
	/**
	 * Parse the publicId from route params back into a resource identifier.
	 */
	parsePublicId: (publicId: string) => ParsedInput | null;
	/**
	 * Build the publicId to place in URLs (keeps URLs stable/user-facing).
	 */
	toPublicId: (resourceId: string) => string;
	/**
	 * Build the cache/storage key for D1/R2 to avoid collisions across hosts.
	 */
	cacheKey: (resourceId: string) => string;
	fetchImage: (resourceId: string) => Promise<HostImage | null>;
	fetchAlbum: (resourceId: string) => Promise<HostAlbum | null>;
	/**
	 * Optional combined fetch when host supports gallery endpoints.
	 */
	fetchGallery?: (
		resourceId: string
	) => Promise<{ isAlbum: boolean; data: HostImage | HostAlbum } | null>;
	download: (url: string) => Promise<ArrayBuffer | null>;
}
