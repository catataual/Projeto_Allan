<script lang="ts">
	import '../styles/global.css';
	import { page } from '$app/state';
	import { createRun, setGameLocale } from '#lib/game.js';
	import { APP_STATE, type AppState } from '#lib/app-state.svelte.js';
	import favicon from '#lib/assets/favicon.svg';
	import { messages, type Locale } from '#lib/i18n.js';
	import { setContext } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const appState = $state<AppState>({ locale: 'pt', game: createRun(false) });
	const t = $derived(messages[appState.locale]);
	const isGameRoute = $derived(page.url.pathname.startsWith('/jogar'));

	setContext(APP_STATE, appState);

	function toggleLanguage(locale: Locale) {
		appState.locale = locale;
		appState.game = setGameLocale(appState.game, locale);
	}

	function restartRun() {
		appState.game = createRun(true, appState.locale);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{t.title} — {t.darkFantasy.toLowerCase()}</title>
	<meta name="description" content={t.pageDescription} />
</svelte:head>

<div class="game-shell" lang={appState.locale === 'en' ? 'en' : 'pt-BR'}>
	<header class="topbar">
		<a class="brand" href="/" aria-label={t.backToMenu}>
			<span class="brand-mark">V</span>
			<span>
				{#if appState.locale === 'en'}
					ASHEN <i>VEIL</i>
				{:else}
					VÉU <i>DE</i> CINZAS
				{/if}
			</span>
		</a>
		<div class="run-label"><span class="live-dot"></span> {isGameRoute ? t.forgottenTrail : t.originalAdventure}</div>
		<nav class="top-actions" aria-label={t.language}>
			<div class="language-switch" role="group" aria-label={t.language}>
				<button
					class:active-language={appState.locale === 'pt'}
					aria-label={t.portuguese}
					aria-pressed={appState.locale === 'pt'}
					onclick={() => toggleLanguage('pt')}>PT</button
				>
				<button
					class:active-language={appState.locale === 'en'}
					aria-label={t.english}
					aria-pressed={appState.locale === 'en'}
					onclick={() => toggleLanguage('en')}>EN</button
				>
			</div>
			{#if page.url.pathname === '/'}
				<a class="restart-link" href="/sobre">{t.about} <span>↗</span></a>
			{:else if page.url.pathname.startsWith('/sobre')}
				<a class="restart-link" href="/">{t.backToMenu} <span>←</span></a>
			{:else}
				<a class="restart-link" href="/">{t.menu} <span>⌂</span></a>
				<button class="restart-link" onclick={restartRun}>{t.newJourney} <span>↻</span></button>
			{/if}
		</nav>
	</header>

	{@render children()}

	<footer><span>{t.title.toUpperCase()}</span><span>{t.prototype} <i>•</i> {t.originalWork}</span></footer>
</div>
