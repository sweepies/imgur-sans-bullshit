import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// No data loading needed for search page
	return {};
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const formData = await request.formData();
		const url = formData.get('q') as string;
		
		if (!url) {
			return fail(400, { error: 'Please provide a URL or ID' });
		}
		
		// Extract ID from URL
		let id: string | undefined;
		
		if (url.includes('imgur.com')) {
			// Extract from URL
			// Handle both standard IDs and gallery slugs (e.g., "fallout-mew-vegas-2dctipx")
			const urlMatch = url.match(/imgur\.com\/(?:a\/|gallery\/)?(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]{4,10})(?:\.[a-zA-Z]+)?/);
			id = urlMatch?.[1];
		} else if (url.includes('i.imgur.com')) {
			// Extract from direct image URL
			const urlMatch = url.match(/i\.imgur\.com\/([a-zA-Z0-9-]+)(?:\.[a-zA-Z]+)?/);
			id = urlMatch?.[1];
		} else {
			// Treat as bare ID
			id = url.match(/^([a-zA-Z0-9-]+)$/)?.[1];
		}
		
		if (!id) {
			return fail(400, { error: 'Invalid Imgur URL or ID' });
		}
		
		// Redirect to the image/album
		const isAlbum = url.includes('/a/') || url.includes('album');
		
		// For gallery slugs, we need to check if it's an album
		let targetUrl: string;
		if (isAlbum) {
			targetUrl = `/a/${id}`;
		} else {
			// Check if this ID is an album by querying the API
			try {
				const imgurClientId = platform?.env?.IMGUR_CLIENT_ID;
				if (!imgurClientId) {
					throw new Error('Imgur client ID not configured');
				}
				
				const albumResponse = await fetch(`https://api.imgur.com/3/album/${id}`, {
					headers: {
						'Authorization': `Client-ID ${imgurClientId}`,
					},
				});
				
				if (albumResponse.ok) {
					targetUrl = `/a/${id}`;
				} else {
					targetUrl = `/${id}`;
				}
			} catch {
				targetUrl = `/${id}`;
			}
		}
		
		throw redirect(302, targetUrl);
	}
};
