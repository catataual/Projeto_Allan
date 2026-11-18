<script lang="ts">
	import '../styles/base.css';
	import { page } from '$app/state';
	import { createRun, setGameLocale } from '#lib/game.js';
	import { APP_STATE, type AppState } from '#lib/app-state.svelte.js';
	import favicon from '#lib/assets/favicon.svg';
	import { messages, type Locale } from '#lib/i18n.js';
	import {
		setMusicMuted,
		setMusicVolume,
		startCombatMusic,
		startMenuMusic,
		stopCombatMusic,
		stopMenuMusic
	} from '#lib/sounds.js';
	import { setContext } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const appState = $state<AppState>({ locale: 'pt', game: createRun(false) });
	const t = $derived(messages[appState.locale]);
	const isGameRoute = $derived(page.url.pathname.startsWith('/jogar'));
	const isMenuRoute = $derived(
		page.url.pathname === '/' || page.url.pathname.startsWith('/sobre')
	);
	const shouldPlayCombatMusic = $derived(isGameRoute && appState.game.phase === 'playing');
	let musicUnlocked = $state(false);
	let musicVolume = $state(30);
	let musicMuted = $state(false);

	setContext(APP_STATE, appState);

	$effect(() => {
		if (musicUnlocked && isMenuRoute) startMenuMusic();
		else stopMenuMusic();

		if (musicUnlocked && shouldPlayCombatMusic) startCombatMusic();
		else stopCombatMusic();
	});

	function unlockMusic() {
		musicUnlocked = true;
		if (isMenuRoute) startMenuMusic();
		else if (shouldPlayCombatMusic) startCombatMusic();
	}

	function toggleMusicMute() {
		if (musicMuted || musicVolume === 0) {
			musicMuted = false;
			if (musicVolume === 0) {
				musicVolume = 30;
				setMusicVolume(0.3);
			}
		} else {
			musicMuted = true;
		}
		setMusicMuted(musicMuted);
	}

	function changeMusicVolume(value: string) {
		musicVolume = Number(value);
		setMusicVolume(musicVolume / 100);
		if (musicVolume > 0 && musicMuted) {
			musicMuted = false;
			setMusicMuted(false);
		}
	}

	function toggleLanguage(locale: Locale) {
		appState.locale = locale;
		appState.game = setGameLocale(appState.game, locale);
	}

	function restartRun() {
		appState.game = createRun(true, appState.locale);
	}
</script>

<svelte:window onpointerdown={unlockMusic} onkeydown={unlockMusic} />

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
			<div class="music-control" role="group" aria-label={t.musicSettings}>
				<button
					class="music-toggle"
					type="button"
					aria-label={musicMuted || musicVolume === 0 ? t.unmuteMusic : t.muteMusic}
					aria-pressed={musicMuted || musicVolume === 0}
					onclick={toggleMusicMute}
				>
					<span aria-hidden="true">{musicMuted || musicVolume === 0 ? '🔇' : '🔊'}</span>
				</button>
				<input
					class="music-volume"
					type="range"
					min="0"
					max="100"
					step="5"
					value={musicVolume}
					aria-label={t.musicVolume}
					oninput={(event) => changeMusicVolume(event.currentTarget.value)}
				/>
			</div>
			{#if page.url.pathname.startsWith('/sobre')}
				<a class="restart-link" href="/">{t.backToMenu} <span>←</span></a>
			{:else if isGameRoute}
				<a class="restart-link" href="/">{t.menu} <span>⌂</span></a>
				<button class="restart-link" onclick={restartRun}>{t.newJourney} <span>↻</span></button>
			{/if}
		</nav>
	</header>

	{@render children()}

	<footer><span>{t.title.toUpperCase()}</span><span>{t.prototype} <i>•</i> {t.originalWork}</span></footer>
</div>
