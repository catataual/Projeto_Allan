<script lang="ts">
	import { getContext } from 'svelte';
	import { APP_STATE, type AppState } from '#lib/app-state.svelte.js';
	import { messages } from '#lib/i18n.js';
	import {
		advanceEncounter,
		createRun,
		endTurn,
		playCard,
		type CardEffect,
	} from '#lib/game.js';

	const appState = getContext<AppState>(APP_STATE);
	const t = $derived(messages[appState.locale]);
	const game = $derived(appState.game);

	function format(text: string, values: Record<string, string | number>): string {
		return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
	}

	function restartRun() {
		appState.game = createRun(true, appState.locale);
	}

	function cardCategory(effect: CardEffect): string {
		if (effect.type === 'damage' || effect.type === 'drain') return t.attackCard;
		if (effect.type === 'block') return t.techniqueCard;
		if (effect.type === 'heal') return t.ritualCard;
		if (effect.type === 'poison') return t.poisonCard;
		return t.strategyCard;
	}
</script>
<main>
		<div class="chapter-line">
			<div>
				<p class="eyebrow">{t.chapterLabel} <span>•</span> {game.stageName}</p>
				<h1>{t.stageTitles[game.encounter]}</h1>
			</div>
			<div class="encounter-number"><span>{t.stageLabel}</span><strong>{String(game.encounter + 1).padStart(2, '0')} <i>/ {String(game.totalEncounters).padStart(2, '0')}</i></strong></div>
		</div>

		<section class="battle-board" aria-label={t.battlefield}>
			<div class="atmosphere"></div>
			<div class="ground-glow"></div>

			<aside class="hero-panel">
				<div class="hero-avatar"><span>ᚨ</span><i></i></div>
				<p class="eyebrow">{t.traveler}</p>
				<h2>Maera</h2>
				<p class="hero-subtitle">{t.heroSubtitle}</p>
				<div class="health-label"><span>{t.vitality}</span><strong>{game.playerHp}<small> / {game.playerMaxHp}</small></strong></div>
				<div class="health-track"><span class="health-fill" style={`width: ${(game.playerHp / game.playerMaxHp) * 100}%`}></span></div>
				{#if game.playerBlock > 0}
					<div class="block-pill">⬡ <strong>{game.playerBlock}</strong> {t.block}</div>
				{/if}
				<div class="hero-meta"><span>✦</span> {t.heroMeta}</div>
			</aside>

			<div class="combat-center">
				<div class="enemy-intent" class:guarding={game.enemyIntent.type === 'guard'}>
					<span class="intent-icon">{game.enemyIntent.type === 'attack' ? '⌁' : '⬡'}</span>
					<div>
						<strong>{game.enemyIntent.type === 'attack' ? t.attackIntent : t.guardIntent}</strong>
						<span>{game.enemyIntent.type === 'attack' ? `${game.enemyIntent.amount} ${t.damage}` : `${game.enemyIntent.amount} ${t.guard}`}</span>
					</div>
				</div>

				<div
					class="enemy-art"
					class:enemy-watcher={game.encounter === 0}
					class:enemy-witch={game.encounter === 1}
					class:enemy-boss={game.encounter === 2}
					aria-label={`${t.enemyArt} ${game.enemyName}`}
				>
					<div class="enemy-halo"></div>
					<div class="enemy-adornment" aria-hidden="true"></div>
					<div class="enemy-cloak"></div>
					<div class="enemy-mask">
						<span class="eye eye-left"></span><span class="eye eye-right"></span>
						<span class="mask-mark"></span>
					</div>
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
						<p class="poison-status">☠ {t.poisonedStatus} {game.enemyPoison} × {game.enemyPoisonTurns} {t.turns}</p>
					{/if}
				</div>
				<div class="combat-log" aria-live="polite">
					{#each game.log.slice(0, 2) as entry, index (entry + index)}
						<p>{entry}</p>
					{/each}
				</div>
			</div>

			<aside class="relic-panel">
				<p class="eyebrow">{t.relic}</p>
				<div class="relic-icon">✧</div>
				<strong>{t.ember}</strong>
				<span>{t.emberDescription}</span>
				<div class="relic-divider"></div>
				<p class="relic-note">{t.relicNote}</p>
			</aside>

			<div class="turn-indicator"><span>{t.turn}</span><strong>{String(game.turn).padStart(2, '0')}</strong></div>
		</section>

		<section class="action-area" aria-label={t.playerHand}>
			<div class="hand-heading">
				<div class="pile-count"><span class="pile-icon">▤</span><span>{t.drawPile} <strong>{game.drawPile.length}</strong></span></div>
				<div class="hand-title"><span class="eyebrow">{t.hand}</span><span class="hand-count">{game.hand.length} {t.cards}</span></div>
				<div class="pile-count discard-count"><span>{t.discardPile} <strong>{game.discardPile.length}</strong></span><span class="pile-icon">▤</span></div>
			</div>

			<div class="cards-row">
				{#each game.hand as card (card.id)}
					<button
						class="card"
						class:unaffordable={game.energy < card.cost}
						disabled={game.energy < card.cost || game.phase !== 'playing'}
						onclick={() => (appState.game = playCard(appState.game, card.id))}
						aria-label={format(t.cardAria, {
							name: card.name,
							cost: card.cost,
							description: card.description
						})}
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
					<span class="energy-label">{t.energy}</span>
				</div>
				{#if game.phase === 'playing'}
					<button class="end-turn" onclick={() => (appState.game = endTurn(appState.game))}>{t.endTurn} <span>→</span></button>
				{:else}
					<div class="result-banner" class:victory={game.phase === 'victory'}>
						<strong>{game.phase === 'victory' ? game.encounter === game.totalEncounters - 1 ? t.journeyComplete : t.stageComplete : t.journeyOver}</strong>
						{#if game.phase === 'victory' && game.encounter < game.totalEncounters - 1}
							<button onclick={() => (appState.game = advanceEncounter(appState.game))}>{t.nextStage} <span>→</span></button>
						{:else}
							<button onclick={restartRun}>{t.playAgain} <span>↻</span></button>
						{/if}
					</div>
				{/if}
				<div class="deck-hint">{t.cardHint}</div>
			</div>
		</section>
</main>
