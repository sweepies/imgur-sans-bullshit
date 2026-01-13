# AGENTS GUIDE

Purpose: help AI agents make safe, minimal, and consistent changes.

## Project summary
- **App:** Imgur Sans Bullshit — clean multi-provider image viewer (SvelteKit, Cloudflare Workers).
- **Providers:** Extensible plugin system supporting Imgur and Postimages via `HostPlugin` interface (@src/lib/hosts/types.ts, @src/lib/hosts/plugins/).
- **Cache/storage:** R2 for binary images, D1 for metadata & gallery → image mapping with provider tracking.
- **Architecture:** Cache-first design — all content flows through `/view` route which fetches from providers and caches to D1+R2. API routes serve cached data only (no live fetching).

## Stack & tooling
- SvelteKit 2 + adapter-cloudflare (@svelte.config.js) with Vite config (@vite.config.ts).
- TypeScript enabled with strict mode.
- Bun scripts: `bun install`, `bun run dev`, `bun run check`, `bun run build`.
- Deployment: `wrangler deploy` (Cloudflare Workers).
- Migrations: `wrangler d1 migrations apply imgur-sans-bullshit --remote`

## Environment & secrets
- Wrangler config: `wrangler.toml` / `.example` for bindings (`R2_BUCKET`, `D1_DATABASE`, `IMGUR_CLIENT_ID`).
- Local dev vars template: `.dev.vars.example`.
- Never commit real secrets; keep runtime values in Wrangler or `.dev.vars` (untracked).

## Database schema
- **Current migrations:**
  - `0001_initial.sql` — Initial images/albums tables
  - `0002_galleries.sql` — Provider-aware galleries system (galleries, gallery_images, provider fields)
  - `0003_rate_limiting.sql` — Rate limiting table (ip, endpoint, window_start, count)
  - `0004_drop_old_albums.sql` — Drops legacy albums/album_images tables
- **Active tables:**
  - `images` — Image metadata with provider_id/provider_image_id tracking
  - `galleries` — Gallery metadata with provider_id/provider_gallery_id tracking
  - `gallery_images` — Junction table (gallery_id, image_id, position) with FOREIGN KEY constraints
  - `rate_limits` — Rate limiting state (15min windows, 100 req/IP/endpoint)
- **Important:** `gallery_images` has FK constraints. Always create gallery record BEFORE adding gallery_images entries.

## Key runtime pieces

### Services
- **D1 service** (@src/lib/services/d1.ts) — CRUD for images/galleries with provider-aware lookups (getImageByProvider, getGalleryByProvider). No staleness logic (removed).
- **R2 service** (@src/lib/services/r2.ts) — Binary storage get/put/delete. No logging in production.
- **Imgur service** (@src/lib/services/imgur.ts) — Imgur API client (getImage, getAlbum, getGallery, downloadImage). No logging in production.
- **Rate limit service** (@src/lib/services/ratelimit.ts) — D1-backed rate limiter with sliding window (15min, 100 req).

### Host plugins
- **Plugin system** (@src/lib/hosts/manager.ts) — HostManager coordinates multiple provider plugins.
- **Imgur plugin** (@src/lib/hosts/plugins/imgur.ts) — Handles Imgur URLs, IDs, gallery detection. Has both `id` and `providerId` fields.
- **Postimages plugin** (@src/lib/hosts/plugins/postimages.ts) — Handles Postimages URLs (gallery/page/direct). Has both `id` and `providerId` fields.
- **Adding plugins:** Implement HostPlugin interface, ensure `providerId` matches `id` for provider tracking.

### Middleware
- **Rate limiting** (@src/lib/middleware/ratelimit.ts) — D1-backed (NOT in-memory), 15min window, 100 req per IP per endpoint. Applied to all public routes.

### Routes
- **Home** (@src/routes/+page.svelte) — GET form to `/view?url=...` (NOT POST to /search).
- **View** (@src/routes/view/+page.server.ts) — Main content route. Accepts `?url=` param, resolves provider via HostManager, checks D1 cache by provider ID, fetches live if missing, persists to R2+D1, returns cached metadata. **Rate limited.**
- **API routes** (cache-only, no live fetching):
  - `/api/album/[id]` — Returns gallery metadata + image IDs from D1 cache. 404 if not cached. **Rate limited.**
  - `/api/image/[id]` — Returns image metadata from D1 cache. 404 if not cached. **Rate limited.**
  - `/raw/[id]` — Returns binary image from R2 cache. 404 if not cached. **Rate limited.**
  - `/health` — Status endpoint (no rate limit).

## Data flow & caching

### Caching strategy
- **Cache-first:** All content must go through `/view` route to be cached. API routes serve cache only.
- **Provider tracking:** D1 stores provider_id + provider_image_id/provider_gallery_id to prevent re-ingestion of same content.
- **No revalidation:** API routes do NOT fetch live data. If cache miss → 404. This is intentional.
- **Cache headers:**
  - `/view` page: `Cache-Control: public, max-age={plugin.config.pageCacheSeconds}` (varies by plugin)
  - `/api/*`: `Cache-Control: public, max-age=300` (5min)
  - `/raw/*`: `Cache-Control: public, max-age=3600` (1hr)

### Gallery persistence order (CRITICAL)
When persisting a gallery in `/view` route:
1. Create gallery metadata object
2. **Insert gallery record to D1 first** (`await d1.setGallery(galleryMeta)`)
3. Then loop through images: persist each image, add to gallery_images
4. Foreign key constraint requires gallery exists before gallery_images entries

## Rate limiting details
- **Implementation:** D1-backed (table: rate_limits), NOT in-memory
- **Config:** 15min window (900000ms), 100 requests max
- **Per-IP, per-endpoint:** Each endpoint has separate limit (view, api:album, api:image, raw)
- **IP detection:** CF-Connecting-IP header → X-Forwarded-For → 'unknown'
- **Response:** Returns 429 with retry-after header when exceeded
- **Cleanup:** No automatic cleanup (consider scheduled worker for rows >24h old)

## Type safety conventions
- **D1 query results:** Use typed row interfaces (D1ImageRow, D1GalleryImageRow) instead of `any`
- **ImageMetadata:** Use exported type from d1.ts for image arrays
- **Transform functions:** Legitimate use of `any` for external API responses (document with JSDoc explaining why)
- **No console.log:** Production services should not log. Errors surface via HTTP responses.

## Conventions for changes
- Use service factories (`createD1Service`, `createR2Service`, `createHostManager`) instead of raw bindings.
- **Always rate limit public routes** — Use `checkRateLimit(request, platform, 'endpoint-name')` after platform check.
- **Foreign key order matters** — Create parent records before children (galleries before gallery_images).
- Keep logging minimal; avoid console.log/error in production paths.
- Plugin `id` and `providerId` must match for provider tracking to work.
- API routes are cache-only by design — don't add live fetching logic.
- Prefer small, reversible changes; avoid touching Wrangler IDs or secrets.

## Dev workflow
1. Install deps: `bun install`
2. Run locally: `bun run dev`
3. Type check: `bun run check`
4. Build: `bun run build`
5. Apply migrations: `bunx wrangler d1 migrations apply imgur-sans-bullshit --remote`
6. Deploy: `bunxwrangler deploy` (ensure `.svelte-kit/cloudflare` exists via build)

## Testing checklist
- [ ] Home form submits to `/view?url=...` (GET request)
- [ ] Imgur URLs work (albums and single images)
- [ ] Postimages URLs work (galleries, pages, direct)
- [ ] Rate limiting triggers after 100 requests (test with curl loop)
- [ ] No console output in `wrangler tail`
- [ ] Type checking passes (`bun run check`)
- [ ] Foreign key constraints don't fail (gallery created before images added)

## Common pitfalls
1. **Foreign key errors** — Always create gallery before adding gallery_images
2. **Missing providerId** — New plugins need both `id` and `providerId` fields
3. **Rate limit in-memory** — Don't use in-memory rate limiting (use D1-backed service)
4. **API live fetching** — Don't add live fetching to API routes (cache-only by design)
5. **Console logging** — Remove all console.log/error from production code paths
6. **Form POST** — Home form uses GET, not POST

## Updating this file
If you change anything that affects architecture, providers, routes, database schema, rate limits, caching strategy, or workflows, **update AGENTS.md in the same commit** so future AI agents stay accurate.
