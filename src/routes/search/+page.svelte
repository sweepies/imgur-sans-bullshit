<script lang="ts">
	export let form: { error?: string } | undefined;
</script>

<svelte:head>
	<title>Search - Imgur Sans Bullshit</title>
</svelte:head>

{#if form?.error}
	<div class="container mx-auto px-4 py-8">
		<div class="max-w-md mx-auto text-center">
			<p class="text-red-400 mb-4">{form.error}</p>
			<a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">
				← Back to Home
			</a>
		</div>
	</div>
{:else}
	<!-- This should not be visible as successful searches redirect immediately -->
	<div class="container mx-auto px-4 py-8">
		<div class="max-w-md mx-auto text-center">
			<p class="text-gray-400">Redirecting...</p>
		</div>
	</div>
{/if}
