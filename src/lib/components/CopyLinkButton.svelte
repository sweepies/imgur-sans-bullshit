<script>
	let { children } = $props();
	async function copyLink() {
		const url = window.location.href;
		await navigator.clipboard.writeText(url);
		alert('Link copied to clipboard!');
	}
</script>

<button
	onclick={copyLink}
	class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
>
	<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
	</svg>
	{#if children}
		{@render children()}
	{:else}
		Copy Link
	{/if}
</button>
