<script lang="ts">
	import { page } from '$app/stores';
	import ImageModal from '$lib/components/ImageModal.svelte';
	import DownloadAlbumButton from '$lib/components/DownloadAlbumButton.svelte';
	import CopyLinkButton from '$lib/components/CopyLinkButton.svelte';
	import ViewOnImgurButton from '$lib/components/ViewOnImgurButton.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	
	export let data;
	
	$: album = data?.album;
	$: images = data?.images || [];
	$: imageIds = data?.imageIds || [];
	
	// Calculate page title
	$: pageTitle = album?.title || `Album ${$page.params.id}`;
	
	let showModal = false;
	let currentImageIndex = 0;
	
	function openImage(index: number) {
		currentImageIndex = index;
		showModal = true;
	}
	
	function closeModal() {
		showModal = false;
	}
	
	function nextImage() {
		if (currentImageIndex < images.length - 1) {
			currentImageIndex++;
		}
	}
	
	function prevImage() {
		if (currentImageIndex > 0) {
			currentImageIndex--;
		}
	}
</script>

<svelte:head>
	<title>{pageTitle} - Imgur Sans Bullshit</title>
</svelte:head>

{#if album && images.length > 0}
	<div class="container mx-auto px-4 py-8">
		<div class="max-w-6xl mx-auto">
			<div class="mb-4">
				<a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">
					← Back to Home
				</a>
			</div>
			
			{#if album.title}
				<h1 class="text-3xl font-bold mb-4">{album.title}</h1>
			{/if}
			
			{#if album.description}
				<p class="text-gray-400 mb-6">{album.description}</p>
			{/if}
			
			<div class="mb-4 text-gray-400">
				{images.length} image{images.length !== 1 ? 's' : ''}
			</div>
			
			<div class="flex flex-wrap justify-center gap-4">
				{#each images as img, index}
					<div 
						class="bg-gray-800 rounded-lg overflow-hidden group cursor-pointer w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
						role="button"
						tabindex="0"
						on:click={() => openImage(index)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								openImage(index);
							}
						}}
					>
						<div class="relative overflow-hidden">
							<img 
								src="/raw/{img.id}"
								alt={img.title || `Image ${img.id}`}
								class="w-full h-auto"
								loading="lazy"
							/>
						</div>
						{#if img.title}
							<div class="p-3">
								<h3 class="font-semibold truncate">{img.title}</h3>
							</div>
						{/if}
					</div>
				{/each}
			</div>
			
			<div class="mt-8 flex flex-wrap gap-4 justify-center">
				<DownloadAlbumButton {imageIds} />
				<CopyLinkButton />
				<ViewOnImgurButton id={$page.params.id || ''} type="album" />
			</div>
		</div>
	</div>
	
	{#if showModal}
		<ImageModal
			images={images}
			imageIds={imageIds}
			currentIndex={currentImageIndex}
			on:close={closeModal}
			on:next={nextImage}
			on:prev={prevImage}
		/>
	{/if}
{:else}
	<LoadingSpinner />
{/if}
