// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	// Cloudflare Workers CacheStorage extension
	interface CacheStorage {
		default: Cache;
	}

	namespace App {
		// interface Error {}
		interface Locals {}
		interface PageData {
			album?: import('$lib/services/d1').GalleryMetadata | null;
			images?: import('$lib/services/d1').ImageMetadata[];
			imageIds?: string[];
		}
		// interface PageState {}
		interface Platform {
			env: {
				R2_BUCKET: R2Bucket;
				D1_DATABASE: D1Database;
				IMGUR_CLIENT_ID: string;
			};
		}
	}
}

export {};
