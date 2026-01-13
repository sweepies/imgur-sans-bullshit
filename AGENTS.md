# AGENTS GUIDE

Purpose: help AI agents make safe, minimal, and consistent changes.

## Project summary
- **App:** Imgur Sans Bullshit — clean Imgur viewer (SvelteKit, Cloudflare Workers).
- **Cache/storage:** R2 for binary images, D1 for metadata & album → image mapping (@migrations/0001_initial.sql#1-40).
- **Third party:** Imgur API via client ID.

## Stack & tooling
- SvelteKit 2 + adapter-cloudflare (@svelte.config.js#1-18) with Vite config (@vite.config.ts#1-7).
- Typescript enabled.
- Bun scripts: `bun install`, `bun run dev`, `bun run check`, `bun run build` (@README.md#41-55).
- Deployment with `wrangler deploy` (Cloudflare Workers).

## Environment & secrets
- Wrangler config: `wrangler.toml` / `.example` for bindings (`R2_BUCKET`, `D1_DATABASE`, `IMGUR_CLIENT_ID`) (@wrangler.toml.example#1-39).
- Local dev vars template: `.dev.vars.example` (@.dev.vars.example#1-2).
- Never commit real secrets; keep runtime values in Wrangler or `.dev.vars` (untracked).

## Key runtime pieces
- **Services:** D1 CRUD and staleness helpers (@src/lib/services/d1.ts#1-70), R2 storage helpers (@src/lib/services/r2.ts#1-58), Imgur fetch/download helper (@src/lib/services/imgur.ts#1-156).
- **Middleware:** In-memory rate limit (15m window, 100 reqs) used on API routes (@src/lib/middleware/rateLimit.ts#1-54).
- **Routes/pages:**
  - Home search form → redirects with extracted ID (@src/routes/+page.svelte#1-42, @src/routes/search/+page.server.ts#1-43).
  - `/[id]` server load: fetches Imgur gallery/album, caches to R2+D1, sets 10m cache header (@src/routes/[id]/+page.server.ts#1-80).
  - `/api/image/[id]` JSON metadata with 15m rate limit, recaches if stale >1h (@src/routes/api/image/[id]/+server.ts#1-81).
  - `/api/album/[id]` JSON metadata + image IDs, recaches album/images if stale >1h (@src/routes/api/album/[id]/+server.ts#1-105).
  - `/raw/[id]` returns binary image (first image if album), recaches if stale >1h (@src/routes/raw/[id]/+server.ts#1-93).
  - `/health` simple status/version (@src/routes/health/+server.ts#1-14).

## Data & caching notes
- Staleness threshold: 1 hour for images/albums before revalidating with Imgur (see API and page loaders above).
- Cache headers: API responses set `Cache-Control: public, max-age=300`; raw images set `max-age=3600`; page load sets `max-age=600`.
- Album → image positions stored in `album_images` table; keep ordering consistent.

## Conventions for changes
- Use provided service factories (`createD1Service`, `createR2Service`, `createImgurService`) instead of raw bindings.
- Preserve rate limiting on public API routes; add if introducing new public endpoints.
- Keep logging minimal in production paths; avoid leaking secrets.
- Prefer small, reversible changes; avoid touching Wrangler IDs or secrets.

## Dev workflow
1) Install deps: `bun install`
2) Run locally: `bun run dev`
3) Type check: `bun run check`
4) Build: `bun run build`
5) Deploy: `wrangler deploy` (ensure `.svelte-kit/cloudflare` exists via build)
6) Migrations: keep D1 schema in `migrations/*.sql` and apply via Wrangler/CF dashboard.

## Updating this file
If you change anything that affects architecture, routes, env vars, caching, rate limits, or workflows, **update AGENTS.md in the same PR** so future AI agents stay accurate.
