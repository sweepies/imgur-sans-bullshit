export interface CacheService {
  get: (key: string) => Promise<Response | null>;
  put: (key: string, response: Response, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export function createCacheService(): CacheService {
  return {
    async get(key: string): Promise<Response | null> {
      const cache = caches.default;
      // Use a simple cache key format
      const url = `https://cache.local/${key}`;
      return await cache.match(url) || null;
    },
    
    async put(key: string, response: Response, ttl: number = 3600): Promise<void> {
      const cache = caches.default;
      const url = `https://cache.local/${key}`;
      // Create a new response with cache-control headers
      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...response.headers,
          'Cache-Control': `public, max-age=${ttl}`,
          'Expires': new Date(Date.now() + ttl * 1000).toUTCString(),
        },
      });
      
      await cache.put(url, cachedResponse);
    },
    
    async delete(key: string): Promise<void> {
      const cache = caches.default;
      const url = `https://cache.local/${key}`;
      await cache.delete(url);
    },
  };
}
