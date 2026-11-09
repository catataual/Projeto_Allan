<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { createRun } from '#lib/game.js';
	import { APP_STATE, type AppState } from '#lib/app-state.svelte.js';
	import { messages } from '#lib/i18n.js';

	const appState = getContext<AppState>(APP_STATE);
	const t = $derived(messages[appState.locale]);

	async function startGame() {
		appState.game = createRun(true, appState.locale);
		await goto('/jogar');
	}
</script>

<main class="title-screen">
	<div class="title-scene" aria-hidden="true">
		<div class="scene-moon"></div>
		<div class="scene-haze"></div>
		<div class="scene-ridge scene-ridge-back"></div>
		<div class="scene-ridge scene-ridge-front"></div>
		<div class="scene-path"></div>
		<div class="scene-tree scene-tree-small scene-tree-small-left"></div>
		<div class="scene-tree scene-tree-left"></div>
		<div class="scene-tree scene-tree-right"></div>
		<div class="scene-tree scene-tree-small scene-tree-small-right"></div>
		<div class="scene-caption"><span>{t.chapterOne}</span><span>{t.forest}</span></div>
	</div>
	<div class="title-content">
		<p class="eyebrow"><span>✦</span> {t.lands} <span>✦</span></p>
		<h1>
			{#if appState.locale === 'en'}
				Ashen<br />Veil
			{:else}
				Véu <i>de</i><br />Cinzas
			{/if}
		</h1>
		<p class="title-subtitle">{t.titleSubtitle}</p>
		<div class="title-actions">
			<button class="primary-action" onclick={startGame}>{t.startJourney} <span>→</span></button>
			<a class="secondary-action" href="/sobre">{t.aboutGame}</a>
		</div>
		<p class="title-footnote"><span class="live-dot"></span> {t.darkFantasy}</p>
	</div>
</main>
