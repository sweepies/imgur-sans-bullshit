export interface ImageMetadata {
  id: string;
  url: string;
  source_url?: string;
  provider_id?: string;
  provider_image_id?: string;
  title?: string;
  description?: string;
  type: string;
  width?: number;
  height?: number;
  size?: number;
  cached_at: number;
  last_checked: number;
  is_deleted: boolean;
}

export interface GalleryMetadata {
  id: string;
  source_url?: string;
  provider_id?: string;
  provider_gallery_id?: string;
  title?: string;
  description?: string;
  images_count: number;
  cached_at: number;
  last_checked: number;
  is_deleted: boolean;
}

// D1 query result row types
interface D1ImageRow {
  id: string;
  url: string;
  source_url: string | null;
  provider_id: string | null;
  provider_image_id: string | null;
  title: string | null;
  description: string | null;
  type: string;
  width: number | null;
  height: number | null;
  size: number | null;
  cached_at: number;
  last_checked: number;
  is_deleted: number;
}

interface D1GalleryImageRow {
  gallery_id: string;
  image_id: string;
  position: number;
}

/// <reference types="@cloudflare/workers-types" />

export interface D1Service {
  // Image operations
  getImage: (id: string) => Promise<ImageMetadata | null>;
  getImageByProvider: (providerId: string, providerImageId: string) => Promise<ImageMetadata | null>;
  setImage: (image: ImageMetadata) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  updateImageCheckTime: (id: string) => Promise<void>;
  
  // Gallery operations (provider-aware albums with local IDs)
  getGallery: (id: string) => Promise<GalleryMetadata | null>;
  getGalleryByProvider: (providerId: string, providerGalleryId: string) => Promise<GalleryMetadata | null>;
  setGallery: (gallery: GalleryMetadata) => Promise<void>;
  deleteGallery: (id: string) => Promise<void>;
  updateGalleryCheckTime: (id: string) => Promise<void>;
  
  // Gallery images
  getGalleryImages: (galleryId: string) => Promise<string[]>;
  addGalleryImage: (galleryId: string, imageId: string, position: number) => Promise<void>;
  removeGalleryImage: (galleryId: string, imageId: string) => Promise<void>;
  
  // Staleness operations
  getStaleImages: (maxAge: number) => Promise<string[]>;
}

export function createD1Service(db: D1Database): D1Service {
  return {
    async getImage(id: string): Promise<ImageMetadata | null> {
      if (!db) return null;
      
      const result = await db.prepare('SELECT * FROM images WHERE id = ?').bind(id).first();
      return result ? result as unknown as ImageMetadata : null;
    },

    async getImageByProvider(providerId: string, providerImageId: string): Promise<ImageMetadata | null> {
      if (!db) return null;
      const result = await db
        .prepare('SELECT * FROM images WHERE provider_id = ? AND provider_image_id = ?')
        .bind(providerId, providerImageId)
        .first();
      return result ? (result as unknown as ImageMetadata) : null;
    },
    
    async setImage(image: ImageMetadata): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare(`
        INSERT OR REPLACE INTO images 
        (id, url, source_url, provider_id, provider_image_id, title, description, type, width, height, size, cached_at, last_checked, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        image.id,
        image.url,
        image.source_url || null,
        image.provider_id || null,
        image.provider_image_id || null,
        image.title || null,
        image.description || null,
        image.type,
        image.width || null,
        image.height || null,
        image.size || null,
        image.cached_at,
        image.last_checked,
        image.is_deleted
      ).run();
    },
    
    async deleteImage(id: string): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare('DELETE FROM images WHERE id = ?').bind(id).run();
    },
    
    async updateImageCheckTime(id: string): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare('UPDATE images SET last_checked = ? WHERE id = ?')
        .bind(Date.now(), id)
        .run();
    },
    
    async getStaleImages(maxAge: number): Promise<string[]> {
      if (!db) return [];
      
      const cutoff = Date.now() - maxAge;
      const results = await db.prepare(
        'SELECT id FROM images WHERE last_checked < ? AND is_deleted = FALSE'
      ).bind(cutoff).all();

      return results.results.map((r: D1ImageRow) => r.id);
    },
    
    async getGallery(id: string): Promise<GalleryMetadata | null> {
      if (!db) return null;
      const result = await db.prepare('SELECT * FROM galleries WHERE id = ?').bind(id).first();
      return result ? (result as unknown as GalleryMetadata) : null;
    },

    async getGalleryByProvider(providerId: string, providerGalleryId: string): Promise<GalleryMetadata | null> {
      if (!db) return null;
      const result = await db
        .prepare('SELECT * FROM galleries WHERE provider_id = ? AND provider_gallery_id = ?')
        .bind(providerId, providerGalleryId)
        .first();
      return result ? (result as unknown as GalleryMetadata) : null;
    },

    async setGallery(gallery: GalleryMetadata): Promise<void> {
      if (!db) throw new Error('D1 database not available');

      await db.prepare(`
        INSERT OR REPLACE INTO galleries 
        (id, provider_id, provider_gallery_id, source_url, title, description, images_count, cached_at, last_checked, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        gallery.id,
        gallery.provider_id || null,
        gallery.provider_gallery_id || null,
        gallery.source_url || null,
        gallery.title || null,
        gallery.description || null,
        gallery.images_count,
        gallery.cached_at,
        gallery.last_checked,
        gallery.is_deleted
      ).run();
    },

    async deleteGallery(id: string): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      await db.prepare('DELETE FROM galleries WHERE id = ?').bind(id).run();
      await db.prepare('DELETE FROM gallery_images WHERE gallery_id = ?').bind(id).run();
    },

    async updateGalleryCheckTime(id: string): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      await db.prepare('UPDATE galleries SET last_checked = ? WHERE id = ?')
        .bind(Date.now(), id)
        .run();
    },

    async getGalleryImages(galleryId: string): Promise<string[]> {
      if (!db) return [];
      const result = await db.prepare('SELECT image_id FROM gallery_images WHERE gallery_id = ? ORDER BY position ASC')
        .bind(galleryId)
        .all();
      return result.results?.map((row: D1GalleryImageRow) => row.image_id) ?? [];
    },

    async addGalleryImage(galleryId: string, imageId: string, position: number): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      await db.prepare(`
        INSERT OR REPLACE INTO gallery_images (gallery_id, image_id, position)
        VALUES (?, ?, ?)
      `).bind(galleryId, imageId, position).run();
    },

    async removeGalleryImage(galleryId: string, imageId: string): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      await db.prepare('DELETE FROM gallery_images WHERE gallery_id = ? AND image_id = ?')
        .bind(galleryId, imageId)
        .run();
    }
  };
}
