# Imgur Sans Bullshit

A clean, fast multi-provider image viewer without ads, trackers, or bullshit. Built with SvelteKit and deployed on Cloudflare Workers.

## Features

- 🚀 Lightning fast image and gallery viewing
- 📱 Responsive design for all devices
- 🎯 No ads, no tracking, no bullshit
- 💾 Automatic caching with R2 storage
- 🔌 Extensible plugin architecture supporting multiple providers
- 🔍 Direct URL support for multiple image hosts
- 📥 Download images and galleries
- 📋 Copy links with one click

## Supported Providers

- **Imgur** - Images, albums, and galleries
- **Postimages** - Images and galleries

## Usage

Simply visit the deployed site and paste any supported URL into the search box. Supported formats:

### Imgur
- Gallery URLs: `https://imgur.com/gallery/abc123`
- Album URLs: `https://imgur.com/a/abc123`
- Direct images: `https://i.imgur.com/abc123.jpg`

### Postimages
- Gallery URLs: `https://postimg.cc/gallery/abc123`
- Page URLs: `https://postimg.cc/abc123`
- Direct images: `https://i.postimg.cc/abc123/filename.jpg`

## Userscript

Enhance your browsing experience with the userscript! It automatically redirects supported image host links to this clean viewer.

### Installation

1. Install a userscript manager for your browser:
   - [Violentmonkey](https://violentmonkey.github.io/) (Chromium-based browsers, Firefox) *(recommended, open source)*
   - [Tampermonkey](https://www.tampermonkey.net/) (Chromium-based browsers, Firefox, Safari)


2. Click this link:
   [Install Userscript](https://raw.githubusercontent.com/sweepies/imgur-sans-bullshit/refs/heads/main/static/userscript.js)

3. Your browser will prompt you to install the script - click "Install"


## Development

### Plugin Architecture

The application uses an extensible plugin system to support multiple image providers. Each plugin implements the `HostPlugin` interface and provides:

- URL matching and parsing
- Resource fetching (images and galleries)
- Cache key management
- Provider-specific configuration

Plugins are located in `src/lib/hosts/plugins/` and managed by `HostManager` in `src/lib/hosts/manager.ts`.

### Adding a New Provider

1. Create a new plugin file in `src/lib/hosts/plugins/`
2. Implement the `HostPluginPlugin` interface
3. Export a `create[Provider]Plugin` function
4. Add the plugin to `HostManager` in `src/lib/hosts/manager.ts`

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Deploy to Cloudflare
bun run build
wrangler deploy
```

## Configuration

1. Copy the example configuration files:
   ```bash
   cp wrangler.toml.example wrangler.toml
   cp .dev.vars.example .dev.vars
   ```

2. Update `wrangler.toml` with your Cloudflare configuration

3. Get an IMGUR_CLIENT_ID (somehow)

4. Update the userscript with your deployed domain

## License

MIT
