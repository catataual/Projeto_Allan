<script lang="ts">
	import './game.css';
	import {
		advanceEncounter,
		createRun,
		endTurn,
		playCard,
		type CardEffect,
		type GameState
	} from '#lib/game.js';

	type Screen = 'menu' | 'about' | 'game';

	const aboutContent = {
		description:
			'Explore um bosque esquecido, enfrente criaturas antigas e descubra o que restou da última chama.',
		genre: 'RPG de cartas por turnos',
		creator: 'Pedro Luiz, Vitoria Diniz, João Luiz e Giulianno Enrique',
		version: 'Protótipo — Unidade 1'
	};

	let screen = $state<Screen>('menu');
	let game = $state<GameState>(createRun(false));

	function startGame() {
		game = createRun();
		screen = 'game';
	}

	function returnToMenu() {
		screen = 'menu';
	}

	function useCard(cardId: string) {
		game = playCard(game, cardId);
	}

	function finishTurn() {
		game = endTurn(game);
	}

	function restartRun() {
		game = createRun();
		screen = 'game';
	}

	function continueJourney() {
		game = advanceEncounter(game);
	}

	function cardCategory(effect: CardEffect): string {
		if (effect.type === 'damage' || effect.type === 'drain') return 'ATAQUE';
		if (effect.type === 'block') return 'TÉCNICA';
		if (effect.type === 'heal') return 'RITUAL';
		if (effect.type === 'poison') return 'VENENO';
		return 'ESTRATÉGIA';
	}
</script>

<svelte:head>
	<title>Véu de Cinzas — uma aventura de cartas</title>
	<meta
		name="description"
		content="Enfrente o Vigia Oco em um protótipo de aventura de cartas e fantasia sombria."
	/>
</svelte:head>

<div class="game-shell">
	<header class="topbar">
		<button class="brand" type="button" onclick={returnToMenu} aria-label="Voltar ao início">
			<span class="brand-mark">V</span>
			<span>VÉU <i>DE</i> CINZAS</span>
		</button>
		<div class="run-label"><span class="live-dot"></span> {screen === 'game' ? 'A TRILHA ESQUECIDA' : 'UMA AVENTURA ORIGINAL'}</div>
		<nav class="top-actions" aria-label="Navegação">
			{#if screen === 'menu'}
				<button class="restart-link" onclick={() => (screen = 'about')}>Sobre <span>↗</span></button>
			{:else if screen === 'about'}
				<button class="restart-link" onclick={returnToMenu}>Voltar ao início <span>←</span></button>
			{:else}
				<button class="restart-link" onclick={returnToMenu}>Menu <span>⌂</span></button>
				<button class="restart-link" onclick={restartRun}>Nova jornada <span>↻</span></button>
			{/if}
		</nav>
	</header>

	{#if screen === 'menu'}
		<main class="title-screen">
			<div class="title-orbit" aria-hidden="true">
				<span class="orbit-mark">V</span>
				<span class="orbit-star">✦</span>
			</div>
			<div class="title-content">
				<p class="eyebrow"><span>✦</span> AS TERRAS AFUNDADAS <span>✦</span></p>
				<h1>Véu <i>de</i><br />Cinzas</h1>
				<p class="title-subtitle">Quando a última chama se apagar,<br />quem ainda se lembrará do caminho?</p>
				<div class="title-actions">
					<button class="primary-action" onclick={startGame}>Começar jornada <span>→</span></button>
					<button class="secondary-action" onclick={() => (screen = 'about')}>Sobre o jogo</button>
				</div>
				<p class="title-footnote"><span class="live-dot"></span> UMA AVENTURA DE FANTASIA SOMBRIA</p>
			</div>
			<div class="title-bottom"><span>CAPÍTULO I</span><span>✧</span><span>O BOSQUE SEM AURORA</span></div>
		</main>
	{:else if screen === 'about'}
		<main class="about-screen">
			<div class="about-heading">
				<p class="eyebrow">VÉU DE CINZAS <span>•</span> INFORMAÇÕES</p>
				<h1>Sobre o jogo</h1>
				<p>Um mundo esquecido, uma chama teimosa e uma jornada que está apenas começando.</p>
			</div>
			<section class="about-card" aria-label="Informações do jogo">
				<div class="about-emblem" aria-hidden="true">V</div>
				<div class="about-details">
					<p class="eyebrow">A HISTÓRIA</p>
					<p class="about-description">{aboutContent.description}</p>
					<dl>
						<div><dt>Gênero</dt><dd>{aboutContent.genre}</dd></div>
						<div><dt>Desenvolvido por</dt><dd>{aboutContent.creator}</dd></div>
						<div><dt>Versão</dt><dd>{aboutContent.version}</dd></div>
					</dl>
					<p class="edit-hint">Para editar estas informações, altere <code>aboutContent</code> no início de <code>src/routes/+page.svelte</code>.</p>
				</div>
			</section>
			<button class="primary-action about-back" onclick={returnToMenu}>Voltar ao início <span>←</span></button>
		</main>
	{:else}
	<main>
		<div class="chapter-line">
			<div>
				<p class="eyebrow">CAPÍTULO I <span>•</span> {game.stageName}</p>
				<h1>{game.encounter === 0 ? 'O bosque sem aurora' : game.encounter === 1 ? 'O brejo dos sussurros' : 'O altar das cinzas'}</h1>
			</div>
			<div class="encounter-number"><span>FASE</span><strong>{String(game.encounter + 1).padStart(2, '0')} <i>/ {String(game.totalEncounters).padStart(2, '0')}</i></strong></div>
		</div>

		<section class="battle-board" aria-label="Campo de batalha">
			<div class="atmosphere"></div>
			<div class="ground-glow"></div>

			<aside class="hero-panel">
				<div class="hero-avatar"><span>ᚨ</span><i></i></div>
				<p class="eyebrow">A ERRANTE</p>
				<h2>Maera</h2>
				<p class="hero-subtitle">Portadora da última chama</p>
				<div class="health-label"><span>VITALIDADE</span><strong>{game.playerHp}<small> / {game.playerMaxHp}</small></strong></div>
				<div class="health-track"><span class="health-fill" style={`width: ${(game.playerHp / game.playerMaxHp) * 100}%`}></span></div>
				{#if game.playerBlock > 0}
					<div class="block-pill">⬡ <strong>{game.playerBlock}</strong> bloqueio</div>
				{/if}
				<div class="hero-meta"><span>✦</span> Em busca de um caminho de volta</div>
			</aside>

			<div class="combat-center">
				<div class="enemy-intent" class:guarding={game.enemyIntent.type === 'guard'}>
					<span class="intent-icon">{game.enemyIntent.type === 'attack' ? '⌁' : '⬡'}</span>
					<div>
						<strong>{game.enemyIntent.type === 'attack' ? 'PREPARA UM GOLPE' : 'VAI SE PROTEGER'}</strong>
						<span>{game.enemyIntent.type === 'attack' ? `${game.enemyIntent.amount} de dano` : `${game.enemyIntent.amount} de bloqueio`}</span>
					</div>
				</div>

				<div
					class="enemy-art"
					class:enemy-witch={game.encounter === 1}
					class:enemy-boss={game.encounter === 2}
					aria-label={game.enemyName}
				>
					<div class="enemy-halo"></div>
					<div class="enemy-cloak"></div>
					<div class="enemy-mask">
						<span class="eye eye-left"></span><span class="eye eye-right"></span>
						<span class="mask-mark"></span>
					</div>
					<div class="enemy-crown">{game.encounter === 1 ? '✧' : game.encounter === 2 ? '♜' : '⌁'}</div>
					<div class="enemy-shadow"></div>
					{#if game.enemyBlock > 0}
						<div class="enemy-shield">⬡ {game.enemyBlock}</div>
					{/if}
				</div>

				<div class="enemy-details">
					<p class="eyebrow">{game.enemyTitle}</p>
					<h2>{game.enemyName}</h2>
					<div class="enemy-health">
						<span class="health-track"><span class="enemy-health-fill" style={`width: ${(game.enemyHp / game.enemyMaxHp) * 100}%`}></span></span>
						<strong>{game.enemyHp}<small> / {game.enemyMaxHp}</small></strong>
					</div>
					{#if game.enemyPoison > 0}
						<p class="poison-status">☠ Veneno: {game.enemyPoison} × {game.enemyPoisonTurns} turnos</p>
					{/if}
				</div>
				<div class="combat-log" aria-live="polite">
					{#each game.log.slice(0, 2) as entry, index (entry + index)}
						<p>{entry}</p>
					{/each}
				</div>
			</div>

			<aside class="relic-panel">
				<p class="eyebrow">RELICÁRIO</p>
				<div class="relic-icon">✧</div>
				<strong>Brasa adormecida</strong>
				<span>Uma chama que ainda se lembra.</span>
				<div class="relic-divider"></div>
				<p class="relic-note">Cada jornada revela um fragmento diferente deste mundo.</p>
			</aside>

			<div class="turn-indicator"><span>RODADA</span><strong>{String(game.turn).padStart(2, '0')}</strong></div>
		</section>

		<section class="action-area" aria-label="Sua mão">
			<div class="hand-heading">
				<div class="pile-count"><span class="pile-icon">▤</span><span>COMPRA <strong>{game.drawPile.length}</strong></span></div>
				<div class="hand-title"><span class="eyebrow">SUA MÃO</span><span class="hand-count">{game.hand.length} cartas</span></div>
				<div class="pile-count discard-count"><span>DESCARTE <strong>{game.discardPile.length}</strong></span><span class="pile-icon">▤</span></div>
			</div>

			<div class="cards-row">
				{#each game.hand as card (card.id)}
					<button
						class="card"
						class:unaffordable={game.energy < card.cost}
						disabled={game.energy < card.cost || game.phase !== 'playing'}
						onclick={() => useCard(card.id)}
						aria-label={`${card.name}, custa ${card.cost} de energia. ${card.description}`}
					>
						<span class="card-cost">{card.cost}</span>
						<span
							class="card-art"
							class:art-attack={card.effect.type === 'damage' || card.effect.type === 'drain'}
							class:art-guard={card.effect.type === 'block'}
							class:art-heal={card.effect.type === 'heal'}
							class:art-poison={card.effect.type === 'poison'}
							class:art-draw={card.effect.type === 'draw'}
						>
							<span>{card.glyph}</span>
						</span>
						<strong class="card-name">{card.name}</strong>
						<span class="card-rule"></span>
						<span class="card-description">{card.description}</span>
						<span class="card-type">{cardCategory(card.effect)}</span>
					</button>
				{/each}
			</div>

			<div class="controls-row">
				<div class="energy-display">
					<span class="energy-gem">✦</span>
					<span class="energy-value">{game.energy}</span>
					<span class="energy-divider">/</span>
					<span class="energy-max">3</span>
					<span class="energy-label">ENERGIA</span>
				</div>
				{#if game.phase === 'playing'}
					<button class="end-turn" onclick={finishTurn}>Encerrar turno <span>→</span></button>
				{:else}
					<div class="result-banner" class:victory={game.phase === 'victory'}>
						<strong>{game.phase === 'victory' ? game.encounter === game.totalEncounters - 1 ? 'JORNADA CONCLUÍDA' : 'FASE CONCLUÍDA' : 'FIM DE JORNADA'}</strong>
						{#if game.phase === 'victory' && game.encounter < game.totalEncounters - 1}
							<button onclick={continueJourney}>Próxima fase <span>→</span></button>
						{:else}
							<button onclick={restartRun}>Jogar novamente <span>↻</span></button>
						{/if}
					</div>
				{/if}
				<div class="deck-hint">Escolha suas cartas com sabedoria.</div>
			</div>
		</section>
	</main>
	{/if}
	<footer><span>VÉU DE CINZAS</span><span>PROTÓTIPO JOGÁVEL <i>•</i> UMA AVENTURA ORIGINAL</span></footer>
</div>
