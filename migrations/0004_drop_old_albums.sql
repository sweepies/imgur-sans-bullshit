-- Drop old album tables (replaced by galleries/gallery_images)
-- Safe to drop: code only references galleries tables
-- User confirmed: start fresh, no data retention needed

DROP TABLE IF EXISTS album_images;
DROP TABLE IF EXISTS albums;
