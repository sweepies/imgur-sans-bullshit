/// <reference types="@cloudflare/workers-types" />

export interface R2Service {
  get: (key: string) => Promise<Response | null>;
  put: (key: string, data: ArrayBuffer, metadata: Record<string, string>) => Promise<void>;
  delete: (key: string) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
}

export function createR2Service(bucket: R2Bucket): R2Service {
  return {
    async get(key: string) {
      if (!bucket) return null;

      const object = await bucket.get(key);
      if (!object) {
        return null;
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000',
          'ETag': object.etag,
        },
      });
    },
    
    async put(key: string, data: ArrayBuffer, metadata: Record<string, string>) {
      if (!bucket) throw new Error('R2 bucket not available');

      await bucket.put(key, data, {
        httpMetadata: {
          contentType: metadata.contentType || 'image/jpeg',
        },
        customMetadata: metadata,
      });
    },
    
    async delete(key: string) {
      if (!bucket) throw new Error('R2 bucket not available');
      
      await bucket.delete(key);
    },
    
    async exists(key: string) {
      if (!bucket) return false;
      
      const object = await bucket.head(key);
      return !!object;
    },
  };
}
