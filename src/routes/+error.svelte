<script>
	import { page } from '$app/stores';
	
	// Calculate page title
	$: pageTitle = $page.status === 404 ? 'Not Found' : 'Server Error';
</script>

<svelte:head>
	<title>{pageTitle} - Imgur Sans Bullshit</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
	<div class="text-center">
		<h1 class="text-4xl font-bold mb-4">
			{$page.status === 404 ? '404 - Not Found' : '500 - Server Error'}
		</h1>
		<p class="text-gray-400 mb-8">
			{$page.status === 404 
				? 'The image or album you\'re looking for doesn\'t exist.' 
				: 'Something went wrong. Please try again later.'}
		</p>
		<a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">
			← Back to Home
		</a>
	</div>
</div>
