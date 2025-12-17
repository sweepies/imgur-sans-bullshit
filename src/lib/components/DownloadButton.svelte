<script lang="ts">
	export let imageId: string;
	export let type: string;
	
	async function downloadImage() {
		const response = await fetch(`/raw/${imageId}`);
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${imageId}.${type.split('/')[1] || 'jpg'}`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<button
	on:click={downloadImage}
	class="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
>
	<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
	</svg>
	<slot>Download</slot>
</button>
