export interface ImageMetadata {
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
}

export interface AlbumMetadata {
  id: string;
  title?: string;
  description?: string;
  images_count: number;
  cached_at: number;
  last_checked: number;
  is_deleted: boolean;
}

export interface D1Service {
  // Image operations
  getImage: (id: string) => Promise<ImageMetadata | null>;
  setImage: (image: ImageMetadata) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  updateImageCheckTime: (id: string) => Promise<void>;
  
  // Album operations
  getAlbum: (id: string) => Promise<AlbumMetadata | null>;
  setAlbum: (album: AlbumMetadata) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  updateAlbumCheckTime: (id: string) => Promise<void>;
  
  // Album images
  getAlbumImages: (albumId: string) => Promise<string[]>;
  addAlbumImage: (albumId: string, imageId: string, position: number) => Promise<void>;
  removeAlbumImage: (albumId: string, imageId: string) => Promise<void>;
  
  // Staleness operations
  getStaleImages: (maxAge: number) => Promise<string[]>;
  getStaleAlbums: (maxAge: number) => Promise<string[]>;
}

export function createD1Service(db: D1Database): D1Service {
  return {
    async getImage(id: string): Promise<ImageMetadata | null> {
      if (!db) return null;
      
      const result = await db.prepare('SELECT * FROM images WHERE id = ?').bind(id).first();
      return result as ImageMetadata || null;
    },
    
    async setImage(image: ImageMetadata): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare(`
        INSERT OR REPLACE INTO images 
        (id, url, title, description, type, width, height, size, cached_at, last_checked, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        image.id,
        image.url,
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
    
    async getAlbum(id: string): Promise<AlbumMetadata | null> {
      if (!db) return null;
      
      const result = await db.prepare('SELECT * FROM albums WHERE id = ?').bind(id).first();
      return result as AlbumMetadata || null;
    },
    
    async setAlbum(album: AlbumMetadata): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare(`
        INSERT OR REPLACE INTO albums 
        (id, title, description, images_count, cached_at, last_checked, is_deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        album.id,
        album.title || null,
        album.description || null,
        album.images_count,
        album.cached_at,
        album.last_checked,
        album.is_deleted
      ).run();
    },
    
    async deleteAlbum(id: string): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare('DELETE FROM albums WHERE id = ?').bind(id).run();
      await db.prepare('DELETE FROM album_images WHERE album_id = ?').bind(id).run();
    },
    
    async updateAlbumCheckTime(id: string): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare('UPDATE albums SET last_checked = ? WHERE id = ?')
        .bind(Date.now(), id)
        .run();
    },
    
    async getAlbumImages(albumId: string): Promise<string[]> {
      if (!db) return [];
      
      const results = await db.prepare(
        'SELECT image_id FROM album_images WHERE album_id = ? ORDER BY position'
      ).bind(albumId).all();
      
      return results.results.map((r: any) => r.image_id);
    },
    
    async addAlbumImage(albumId: string, imageId: string, position: number): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare(
        'INSERT OR REPLACE INTO album_images (album_id, image_id, position) VALUES (?, ?, ?)'
      ).bind(albumId, imageId, position).run();
    },
    
    async removeAlbumImage(albumId: string, imageId: string): Promise<void> {
      if (!db) throw new Error('D1 database not available');
      
      await db.prepare(
        'DELETE FROM album_images WHERE album_id = ? AND image_id = ?'
      ).bind(albumId, imageId).run();
    },
    
    async getStaleImages(maxAge: number): Promise<string[]> {
      if (!db) return [];
      
      const cutoff = Date.now() - maxAge;
      const results = await db.prepare(
        'SELECT id FROM images WHERE last_checked < ? AND is_deleted = FALSE'
      ).bind(cutoff).all();
      
      return results.results.map((r: any) => r.id);
    },
    
    async getStaleAlbums(maxAge: number): Promise<string[]> {
      if (!db) return [];
      
      const cutoff = Date.now() - maxAge;
      const results = await db.prepare(
        'SELECT id FROM albums WHERE last_checked < ? AND is_deleted = FALSE'
      ).bind(cutoff).all();
      
      return results.results.map((r: any) => r.id);
    },
  };
}
