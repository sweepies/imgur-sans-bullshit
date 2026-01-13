-- Galleries table to support provider-aware albums with local IDs
CREATE TABLE IF NOT EXISTS galleries (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_gallery_id TEXT,
  source_url TEXT,
  title TEXT,
  description TEXT,
  images_count INTEGER DEFAULT 0,
  cached_at INTEGER NOT NULL,
  last_checked INTEGER NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Gallery images junction table (ordered)
CREATE TABLE IF NOT EXISTS gallery_images (
  gallery_id TEXT,
  image_id TEXT,
  position INTEGER,
  PRIMARY KEY (gallery_id, image_id),
  FOREIGN KEY (gallery_id) REFERENCES galleries(id),
  FOREIGN KEY (image_id) REFERENCES images(id)
);

-- Add provider/source fields to images for revalidation and source links
ALTER TABLE images ADD COLUMN provider_id TEXT;
ALTER TABLE images ADD COLUMN provider_image_id TEXT;
ALTER TABLE images ADD COLUMN source_url TEXT;

-- Add provider/source fields to albums for legacy compatibility
ALTER TABLE albums ADD COLUMN provider_id TEXT;
ALTER TABLE albums ADD COLUMN provider_gallery_id TEXT;
ALTER TABLE albums ADD COLUMN source_url TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_galleries_last_checked ON galleries(last_checked);
CREATE INDEX IF NOT EXISTS idx_galleries_provider ON galleries(provider_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_gallery_id ON gallery_images(gallery_id);
