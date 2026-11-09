<script lang="ts">
	import { getContext } from 'svelte';
	import { APP_STATE, type AppState } from '#lib/app-state.svelte.js';
	import { messages } from '#lib/i18n.js';

	const appState = getContext<AppState>(APP_STATE);
	const t = $derived(messages[appState.locale]);

	const aboutContent = {
		description: {
			pt: 'Explore um bosque esquecido, enfrente criaturas antigas e descubra o que restou da última chama.',
			en: 'Explore a forgotten forest, face ancient creatures, and discover what remains of the last flame.'
		},
		genre: { pt: 'RPG de cartas por turnos', en: 'Turn-based card RPG' },
		creator: 'Pedro Luiz, Vitoria Diniz, João Luiz e Giulianno Enrique',
		version: { pt: 'Protótipo — Unidade 1', en: 'Prototype — Unit 1' }
	};
</script>

<main class="about-screen">
	<div class="about-heading">
		<p class="eyebrow">{t.aboutEyebrow}</p>
		<h1>{t.aboutHeading}</h1>
		<p>{t.aboutSubtitle}</p>
	</div>
	<section class="about-card" aria-label={t.aboutHeading}>
		<div class="about-emblem" aria-hidden="true">V</div>
		<div class="about-details">
			<p class="eyebrow">{t.story}</p>
			<p class="about-description">{aboutContent.description[appState.locale]}</p>
			<dl>
				<div><dt>{t.genreLabel}</dt><dd>{aboutContent.genre[appState.locale]}</dd></div>
				<div><dt>{t.creatorLabel}</dt><dd>{aboutContent.creator}</dd></div>
				<div><dt>{t.versionLabel}</dt><dd>{aboutContent.version[appState.locale]}</dd></div>
			</dl>
			<p class="edit-hint">{t.aboutEditHint} <code>aboutContent</code> {t.inFile} <code>src/routes/sobre/+page.svelte</code>.</p>
		</div>
	</section>
	<a class="primary-action about-back" href="/">{t.backToMenu} <span>←</span></a>
</main>
