<script lang="ts">
	import { navigating } from '$app/stores';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	const isNavigating = $derived($navigating !== null);

	let urlInput = $state('');

	function handleSubmit(e: SubmitEvent) {
		if (!urlInput || urlInput.trim() === '') {
			e.preventDefault();
			return;
		}
	}
</script>

<svelte:head>
	<title>Home - Imgur Sans Bullshit</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-4xl font-bold text-center mb-8">Imgur Sans Bullshit</h1>
	<p class="text-center text-gray-400 mb-8">
		View Imgur images without the bullshit
	</p>
	<div class="max-w-md mx-auto">
		<form class="flex gap-2" method="get" action="/view" onsubmit={handleSubmit}>
			<input
				type="text"
				name="url"
				bind:value={urlInput}
				placeholder="Enter Imgur URL or ID"
				class="flex-1 px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				disabled={isNavigating}
				required
			/>
			<button
				type="submit"
				class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
				disabled={isNavigating || !urlInput.trim()}
			>
				{#if isNavigating}
					<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				{/if}
				View
			</button>
		</form>
	</div>
</div>
