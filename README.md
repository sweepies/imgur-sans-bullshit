# Imgur Sans Bullshit

A clean, fast Imgur viewer without ads, trackers, or bullshit. Built with SvelteKit and deployed on Cloudflare Workers.

## Features

- 🚀 Lightning fast image and album viewing
- 📱 Responsive design for all devices
- 🎯 No ads, no tracking, no bullshit
- 💾 Automatic caching with R2 storage
- 🔍 Direct URL support (imgur.com, i.imgur.com)
- 📥 Download images and albums
- 📋 Copy links with one click

## Usage

Simply visit the deployed site and paste any Imgur URL or ID into the search box. Supported formats:

- Direct URLs: `https://imgur.com/gallery/abc123`
- Album URLs: `https://imgur.com/a/abc123`
- Direct images: `https://i.imgur.com/abc123.jpg`
- Just the ID: `abc123`

## Userscript

Enhance your Imgur experience with the userscript! It automatically redirects Imgur links to this clean viewer.

### Installation

1. Install a userscript manager for your browser:
   - [Violentmonkey](https://violentmonkey.github.io/) (Chromium-based browsers, Firefox) *(recommended, open source)*
   - [Tampermonkey](https://www.tampermonkey.net/) (Chromium-based browsers, Firefox, Safari)


2. Click this link:
   [Install Userscript](https://raw.githubusercontent.com/sweepies/imgur-sans-bullshit/refs/heads/main/static/userscript.js)

3. Your browser will prompt you to install the script - click "Install"


## Development

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
