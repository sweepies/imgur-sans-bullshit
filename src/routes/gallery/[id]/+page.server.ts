import type { PageServerLoad } from './$types';
import { createImgurService } from '$lib/services/imgur';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { id } = params;
	
	if (!platform?.env) {
		throw error(500, 'Service not available');
	}
	
	const imgur = createImgurService(platform.env.IMGUR_CLIENT_ID);
	
	// First try to get as album
	const album = await imgur.getAlbum(id);
	
	if (album) {
		// Always redirect to album view
		throw redirect(302, `/a/${id}`);
	}
	
	// Try to get as single image
	const image = await imgur.getImage(id);
	if (image) {
		throw redirect(302, `/${id}`);
	}
	
	throw error(404, 'Gallery not found');
};
