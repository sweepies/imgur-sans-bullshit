export interface ImgurImage {
  id: string;
  title?: string;
  description?: string;
  type: string;
  width?: number;
  height?: number;
  size?: number;
  link: string;
  animated?: boolean;
}

export interface ImgurAlbum {
  id: string;
  title?: string;
  description?: string;
  images_count: number;
  images: ImgurImage[];
}

export interface ImgurService {
  getImage: (id: string) => Promise<ImgurImage | null>;
  getAlbum: (id: string) => Promise<ImgurAlbum | null>;
  getGallery: (id: string) => Promise<{ is_album: boolean; data: ImgurImage | ImgurAlbum } | null>;
  downloadImage: (url: string) => Promise<ArrayBuffer | null>;
}

const IMGUR_API_BASE = 'https://api.imgur.com/3';
const IMGUR_CDN_BASE = 'https://i.imgur.com';

export function createImgurService(clientId: string): ImgurService {
  return {
    async getImage(id: string): Promise<ImgurImage | null> {
      try {
        // Try gallery API first
        const galleryResponse = await fetch(`${IMGUR_API_BASE}/gallery/image/${id}`, {
          headers: {
            'Authorization': `Client-ID ${clientId}`,
          },
        });
        
        if (galleryResponse.ok) {
          const galleryData = await galleryResponse.json() as { success: boolean; data: any };
          if (galleryData.success && galleryData.data) {
            return transformGalleryImage(galleryData.data);
          }
        }
        
        // Try image API
        const imageResponse = await fetch(`${IMGUR_API_BASE}/image/${id}`, {
          headers: {
            'Authorization': `Client-ID ${clientId}`,
          },
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json() as { success: boolean; data: any };
          if (imageData.success && imageData.data) {
            return transformImage(imageData.data);
          }
        }
        
        // Fallback: try to construct from CDN
        const extensions = ['jpg', 'png', 'gif', 'webp', 'mp4'];
        for (const ext of extensions) {
          const testUrl = `${IMGUR_CDN_BASE}/${id}.${ext}`;
          const headResponse = await fetch(testUrl, { method: 'HEAD' });
          if (headResponse.ok) {
            return {
              id,
              link: testUrl,
              type: ext === 'mp4' ? 'video/mp4' : `image/${ext}`,
            };
          }
        }
        
        return null;
      } catch (error) {
        return null;
      }
    },
    
    async getAlbum(id: string): Promise<ImgurAlbum | null> {
      try {
        const response = await fetch(`${IMGUR_API_BASE}/album/${id}`, {
          headers: {
            'Authorization': `Client-ID ${clientId}`,
          },
        });
        
        if (!response.ok) return null;
        
        const data = await response.json() as { success: boolean; data: any };
        if (!data.success || !data.data) return null;
        
        return transformAlbum(data.data);
      } catch (error) {
        return null;
      }
    },
    
    async getGallery(id: string): Promise<{ is_album: boolean; data: ImgurImage | ImgurAlbum } | null> {
      try {
        const response = await fetch(`${IMGUR_API_BASE}/gallery/${id}`, {
          headers: {
            'Authorization': `Client-ID ${clientId}`,
          },
        });
        
        if (!response.ok) return null;
        
        const data = await response.json() as { success: boolean; data: any };
        if (!data.success || !data.data) return null;
        
        return {
          is_album: data.data.is_album || false,
          data: data.data.is_album ? transformAlbum(data.data) : transformGalleryImage(data.data)
        };
      } catch (error) {
        return null;
      }
    },
    
    async downloadImage(url: string): Promise<ArrayBuffer | null> {
      try {
        // For Cloudflare Workers, we need to use the direct CDN URL
        // Add a user agent to avoid being blocked
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
      } catch (error) {
        return null;
      }
    },
  };
}

/**
 * Transform Imgur API response to ImgurImage.
 * Uses any due to varying Imgur API response structures.
 */
function transformImage(data: any): ImgurImage {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    type: data.type,
    width: data.width,
    height: data.height,
    size: data.size,
    link: data.link,
    animated: data.animated,
  };
}

/**
 * Transform Imgur gallery API response to ImgurImage.
 * Uses any due to varying Imgur API response structures.
 */
function transformGalleryImage(data: any): ImgurImage {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    type: data.type || 'image/jpeg',
    width: data.width,
    height: data.height,
    size: data.size,
    link: data.link || `${IMGUR_CDN_BASE}/${data.id}.${data.type?.split('/')[1] || 'jpg'}`,
    animated: data.animated,
  };
}

/**
 * Transform Imgur API response to ImgurAlbum.
 * Uses any due to varying Imgur API response structures.
 */
function transformAlbum(data: any): ImgurAlbum {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    images_count: data.images_count || data.images?.length || 0,
    images: data.images?.map(transformImage) || [],
  };
}
