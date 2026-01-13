<script lang="ts">
	import ImageModal from '$lib/components/ImageModal.svelte';
	import DownloadAlbumButton from '$lib/components/DownloadAlbumButton.svelte';
	import CopyLinkButton from '$lib/components/CopyLinkButton.svelte';
	import ViewOnImgurButton from '$lib/components/ViewOnImgurButton.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { data } = $props();

	const album = $derived(data?.album);
	const images = $derived(data?.images || []);
	const imageIds = $derived(data?.imageIds || []);

	const pageTitle = $derived(album?.title || (images.length === 1 ? images[0]?.title : null) || 'Image');

	let showModal = $state(false);
	let currentImageIndex = $state(0);

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

{#if images.length > 0}
	<div class="container mx-auto px-4 py-8">
		<div class="max-w-6xl mx-auto">
			<div class="mb-4">
				<a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">
					← Back to Home
				</a>
			</div>

			{#if album?.title}
				<h1 class="text-3xl font-bold mb-4">{album.title}</h1>
			{:else if images.length === 1 && images[0]?.title}
				<h1 class="text-3xl font-bold mb-4">{images[0].title}</h1>
			{/if}

			{#if album?.description}
				<p class="text-gray-400 mb-6">{album.description}</p>
			{:else if images.length === 1 && images[0]?.description}
				<p class="text-gray-400 mb-6">{images[0].description}</p>
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
						onclick={() => openImage(index)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								openImage(index);
							}
						}}
					>
						<div class="relative overflow-hidden">
							<img
								src={`/raw/${img.id}`}
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
				<DownloadAlbumButton {imageIds}>
					Download All
				</DownloadAlbumButton>
				<CopyLinkButton>
					Copy Link
				</CopyLinkButton>
				<ViewOnImgurButton type={album ? 'album' : 'image'} url={album?.source_url || images[0]?.source_url}>
					View at source
				</ViewOnImgurButton>
			</div>
		</div>
	</div>

	{#if showModal}
		<ImageModal
			images={images}
			imageIds={imageIds}
			currentIndex={currentImageIndex}
			onclose={closeModal}
			onnext={nextImage}
			onprev={prevImage}
		/>
	{/if}
{:else}
	<LoadingSpinner />
{/if}
