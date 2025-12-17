<script lang="ts">
	import { page } from '$app/stores';
	import DownloadButton from '$lib/components/DownloadButton.svelte';
	import CopyLinkButton from '$lib/components/CopyLinkButton.svelte';
	import ViewOnImgurButton from '$lib/components/ViewOnImgurButton.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	
	export let data;
	
	$: image = data?.image;
	
	// Calculate page title
	$: pageTitle = image?.title || `Image ${$page.params.id}`;
</script>

<svelte:head>
	<title>{pageTitle} - Imgur Sans Bullshit</title>
</svelte:head>

{#if image}
	<div class="container mx-auto px-4 py-8">
		<div class="max-w-4xl mx-auto">
			<div class="mb-4">
				<a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">
					← Back to Home
				</a>
			</div>
			
			{#if image.title}
				<h1 class="text-3xl font-bold mb-4">{image.title}</h1>
			{/if}
			
			{#if image.description}
				<p class="text-gray-400 mb-6">{image.description}</p>
			{/if}
			
			<div class="bg-gray-800 rounded-lg overflow-hidden mb-6 text-center">
				<img 
					src="/raw/{$page.params.id}"
					alt={image.title || `Image ${$page.params.id}`}
					class="inline-block max-w-full h-auto"
					loading="lazy"
				/>
			</div>
			
			<div class="flex flex-wrap gap-4 justify-center">
				<DownloadButton imageId={$page.params.id || ''} type={image?.type || 'image/jpeg'} />
				<CopyLinkButton />
				<ViewOnImgurButton id={$page.params.id || ''} type="image" />
			</div>
			
			{#if image.width && image.height}
				<div class="text-center mt-6 text-gray-400">
					Dimensions: {image.width} × {image.height}
					{#if image.size} • Size: {(image.size / 1024 / 1024).toFixed(2)} MB{/if}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<LoadingSpinner />
{/if}
