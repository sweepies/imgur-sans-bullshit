import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return new Response(JSON.stringify({
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: '2.0.0'
	}), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
