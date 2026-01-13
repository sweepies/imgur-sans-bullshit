import type { HostPlugin, HostRateLimitConfig, ParsedInput } from './types';
import { createImgurPlugin } from './plugins/imgur';
import { createPostImagesPlugin } from './plugins/postimages';

type Env = {
	IMGUR_CLIENT_ID: string;
};

const DEFAULT_RATE_LIMIT: HostRateLimitConfig = {
	windowMs: 15 * 60 * 1000,
	maxRequests: 100
};

export interface HostManager {
	plugins: HostPlugin[];
	defaultPlugin: HostPlugin;
	resolveInput: (input: string) => ParsedInput | null;
	parsePublicId: (publicId: string) => ParsedInput | null;
	getPlugin: (id: string) => HostPlugin | null;
	cacheKey: (plugin: HostPlugin, resourceId: string) => string;
	resourceIdFromCacheKey: (plugin: HostPlugin, cacheKey: string) => string;
	toPublicId: (plugin: HostPlugin, resourceId: string) => string;
	getRateLimit: (plugin: HostPlugin) => HostRateLimitConfig;
}

export function createHostManager(env: Env): HostManager {
	const plugins: HostPlugin[] = [createImgurPlugin(env.IMGUR_CLIENT_ID), createPostImagesPlugin()];
	const defaultPlugin = plugins[0];

	function getPlugin(id: string): HostPlugin | null {
		return plugins.find((plugin) => plugin.id === id) || null;
	}

	function resolveInput(input: string): ParsedInput | null {
		for (const plugin of plugins) {
			if (plugin.matchInput(input)) {
				const parsed = plugin.parseInput(input);
				if (parsed) return parsed;
			}
		}
		// Fallback: let the default plugin try to parse
		return defaultPlugin.parseInput(input);
	}

	function parsePublicId(publicId: string): ParsedInput | null {
		// Prefix form: "<pluginId>:<rest>"
		const prefixMatch = publicId.match(/^([a-z0-9_-]+):(.*)$/i);
		if (prefixMatch) {
			const [, pluginId, rest] = prefixMatch;
			const plugin = getPlugin(pluginId);
			if (plugin) {
				const parsed = plugin.parsePublicId(publicId);
				if (parsed) return parsed;
				// If plugin did not handle prefix, fallback to basic mapping
				return {
					pluginId,
					resourceId: rest,
					publicId: publicId
				};
			}
		}

		// Try each plugin's publicId parser
		for (const plugin of plugins) {
			const parsed = plugin.parsePublicId(publicId);
			if (parsed) return parsed;
		}

		// Default plugin fallback to preserve backward compatibility
		return defaultPlugin.parsePublicId(publicId);
	}

	function cacheKey(plugin: HostPlugin, resourceId: string): string {
		const candidate = plugin.cacheKey(resourceId);
		if (plugin === defaultPlugin) return candidate;
		if (candidate.startsWith(`${plugin.id}:`)) return candidate;
		return `${plugin.id}:${candidate}`;
	}

	function resourceIdFromCacheKey(plugin: HostPlugin, key: string): string {
		const prefix = `${plugin.id}:`;
		return key.startsWith(prefix) ? key.slice(prefix.length) : key;
	}

	function toPublicId(plugin: HostPlugin, resourceId: string): string {
		return plugin.toPublicId(resourceId);
	}

	function getRateLimit(plugin: HostPlugin): HostRateLimitConfig {
		return plugin.config.rateLimit ?? DEFAULT_RATE_LIMIT;
	}

	return {
		plugins,
		defaultPlugin,
		resolveInput,
		parsePublicId,
		getPlugin,
		cacheKey,
		resourceIdFromCacheKey,
		toPublicId,
		getRateLimit
	};
}
