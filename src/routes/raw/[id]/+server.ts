import type { RequestHandler } from './$types';
import { createR2Service } from '$lib/services/r2';
import { createD1Service } from '$lib/services/d1';
import { error } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/middleware/ratelimit';

export const GET: RequestHandler = async ({ params, platform, setHeaders, request }) => {
	const { id } = params;

	if (!platform?.env) {
		throw error(500, 'Service not available');
	}

	await checkRateLimit(request, platform, 'raw');

	const r2 = createR2Service(platform.env.R2_BUCKET);
	const d1 = createD1Service(platform.env.D1_DATABASE);

	const meta = await d1.getImage(id);
	if (!meta || meta.is_deleted) {
		throw error(404, 'Image not found');
	}

	const bin = await r2.get(id);
	if (!bin) {
		throw error(404, 'Image not found');
	}

	setHeaders({
		'Cache-Control': 'public, max-age=3600'
	});

	return new Response(bin.body, {
		headers: {
			'Content-Type': bin.headers.get('Content-Type') || meta.type || 'image/jpeg',
			'Content-Length': bin.headers.get('Content-Length') || '',
			'ETag': bin.headers.get('ETag') || '',
			'Last-Modified': bin.headers.get('Last-Modified') || '',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
