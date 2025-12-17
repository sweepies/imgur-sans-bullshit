-- Images table
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size INTEGER,
  cached_at INTEGER NOT NULL,
  last_checked INTEGER NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  images_count INTEGER DEFAULT 0,
  cached_at INTEGER NOT NULL,
  last_checked INTEGER NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Album images junction table
CREATE TABLE IF NOT EXISTS album_images (
  album_id TEXT,
  image_id TEXT,
  position INTEGER,
  PRIMARY KEY (album_id, image_id),
  FOREIGN KEY (album_id) REFERENCES albums(id),
  FOREIGN KEY (image_id) REFERENCES images(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_images_last_checked ON images(last_checked);
CREATE INDEX IF NOT EXISTS idx_albums_last_checked ON albums(last_checked);
CREATE INDEX IF NOT EXISTS idx_album_images_album_id ON album_images(album_id);
