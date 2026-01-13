import type { RequestHandler } from './$types';
import { createD1Service } from '$lib/services/d1';
import { error } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/middleware/ratelimit';

export const GET: RequestHandler = async ({ params, platform, setHeaders, request }) => {
	const { id } = params;
	if (!platform?.env) {
		throw error(500, 'Service not available');
	}

	await checkRateLimit(request, platform, 'api:image');

	const d1 = createD1Service(platform.env.D1_DATABASE);
	const metadata = await d1.getImage(id);

	if (!metadata || metadata.is_deleted) {
		throw error(404, 'Image not found');
	}

	setHeaders({
		'Cache-Control': 'public, max-age=300'
	});

	return new Response(JSON.stringify(metadata), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=300'
		}
	});
};
