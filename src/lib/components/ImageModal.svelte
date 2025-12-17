<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	
	export let images: any[];
	export let imageIds: string[];
	export let currentIndex = 0;
	
	const dispatch = createEventDispatcher();
	
	function closeModal() {
		dispatch('close');
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft' && currentIndex > 0) {
			currentIndex--;
			dispatch('prev');
		} else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
			currentIndex++;
			dispatch('next');
		} else if (e.key === 'Escape') {
			closeModal();
		}
	}
	
	$: if (typeof window !== 'undefined') {
		window.addEventListener('keydown', handleKeydown);
	}
	
	function handleClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	}
	
	function nextImage() {
		if (currentIndex < images.length - 1) {
			currentIndex++;
			dispatch('next');
		}
	}
	
	function prevImage() {
		if (currentIndex > 0) {
			currentIndex--;
			dispatch('prev');
		}
	}
</script>

<div 
	class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="modal-title"
	tabindex="-1"
	on:click={handleClick}
	on:keydown={(e) => {
		if (e.key === 'Escape') {
			closeModal();
		}
	}}
>
	<div class="max-w-4xl max-h-full overflow-auto flex flex-col items-center">
		<img 
			src="/raw/{imageIds[currentIndex]}"
			alt={images[currentIndex]?.title || `Image ${imageIds[currentIndex]}`}
			class="max-w-full h-auto"
		/>
		{#if images[currentIndex]?.title}
			<div id="modal-title" class="text-center mt-4 text-xl text-white">
				{images[currentIndex].title}
			</div>
		{/if}
		
		{#if images.length > 1}
			<div class="flex gap-4 mt-4">
				<button 
					on:click={prevImage}
					disabled={currentIndex === 0}
					class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
				>
					← Previous
				</button>
				<span class="text-white flex items-center">
					{currentIndex + 1} / {images.length}
				</span>
				<button 
					on:click={nextImage}
					disabled={currentIndex === images.length - 1}
					class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
				>
					Next →
				</button>
			</div>
		{/if}
	</div>
</div>
