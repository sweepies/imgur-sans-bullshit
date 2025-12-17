<script lang="ts">
	let { id, type = 'image', children } = $props();
	
	const url = $derived(type === 'album' ? `https://imgur.com/a/${id}` : `https://imgur.com/${id}`);
</script>

<a
	href={url}
	target="_blank"
	rel="noopener noreferrer"
	class="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
>
	<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
	</svg>
	{#if children}
		{@render children()}
	{:else}
		View on Imgur
	{/if}
</a>
