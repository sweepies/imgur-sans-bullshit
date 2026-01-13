import type { RequestHandler } from './$types';
import { createD1Service } from '$lib/services/d1';
import { error } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/middleware/ratelimit';

export const GET: RequestHandler = async ({ params, platform, setHeaders, request }) => {
	const { id } = params;

	if (!platform?.env) {
		throw error(500, 'Service not available');
	}

	await checkRateLimit(request, platform, 'api:album');

	const d1 = createD1Service(platform.env.D1_DATABASE);
	const gallery = await d1.getGallery(id);

	if (!gallery || gallery.is_deleted) {
		throw error(404, 'Gallery not found');
	}

	const images = await d1.getGalleryImages(id);

	setHeaders({
		'Cache-Control': 'public, max-age=300'
	});

	return new Response(
		JSON.stringify({
			...gallery,
			images
		}),
		{
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=300'
			}
		}
	);
};
