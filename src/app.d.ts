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
			image?: {
				id: string;
				url: string;
				title?: string;
				description?: string;
				type: string;
				width?: number;
				height?: number;
				size?: number;
				cached_at: number;
				last_checked: number;
				is_deleted: boolean;
			};
			album?: {
				id: string;
				title?: string;
				description?: string;
				images_count: number;
				cached_at: number;
				last_checked: number;
				is_deleted: boolean;
			};
			images?: any[];
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
