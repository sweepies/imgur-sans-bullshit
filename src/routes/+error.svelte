<script>
	import { page } from '$app/stores';

	// Calculate page title based on status
	const pageTitle = $derived(
		$page.status === 404 ? 'Not Found' :
		$page.status === 400 ? 'Invalid Request' :
		'Server Error'
	);

	// Get error message, fallback to status-specific defaults
	const errorMessage = $derived(
		$page.error?.message ||
		($page.status === 404 ? 'The image or album you\'re looking for doesn\'t exist.' :
		 $page.status === 400 ? 'The URL or ID you provided is not valid.' :
		 'Something went wrong. Please try again later.')
	);
</script>

<svelte:head>
	<title>{pageTitle} - Imgur Sans Bullshit</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
	<div class="text-center max-w-2xl">
		<h1 class="text-4xl font-bold mb-4">
			{$page.status} - {pageTitle}
		</h1>
		<p class="text-gray-400 mb-8">
			{errorMessage}
		</p>
		<a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">
			← Back to Home
		</a>
	</div>
</div>
