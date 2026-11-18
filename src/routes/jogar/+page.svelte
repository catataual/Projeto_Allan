<script lang="ts">
	import { getContext, onDestroy } from 'svelte';
	import { APP_STATE, type AppState } from '#lib/app-state.svelte.js';
	import { messages } from '#lib/i18n.js';
	import {
		advanceEncounter,
		createRun,
		endTurn,
		playCard,
		type Card,
		type CardEffect,
	} from '#lib/game.js';
	import {
		playPhaseMusic,
		playGameSound,
		startCombatMusic,
		stopCombatMusic,
		type GameSound
	} from '#lib/sounds.js';

	const appState = getContext<AppState>(APP_STATE);
	const t = $derived(messages[appState.locale]);
	const game = $derived(appState.game);
	type CardSoundKey = Exclude<Card['cardKey'], 'vitalDew' | 'emberBreath'>;
	const cardSounds: Record<CardSoundKey, GameSound> = {
		ashBlade: 'blade',
		ironStance: 'shield',
		breaker: 'punch',
		poisonThorns: 'smoke',
		lifeDrain: 'punch'
	};

	type FeedbackKind = 'damage' | 'heal' | 'block' | 'blocked' | 'shield';
	type EnemyMotion = 'hit' | 'attack' | 'guard';
	type CombatFeedback = { id: number; amount: number; kind: FeedbackKind };

	let playerFeedback = $state<CombatFeedback | null>(null);
	let enemyFeedback = $state<CombatFeedback | null>(null);
	let enemyMotion = $state<EnemyMotion | null>(null);
	let enemyMotionId = $state(0);
	let feedbackId = 0;
	let playerFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;
	let enemyFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;
	let enemyMotionTimeout: ReturnType<typeof setTimeout> | undefined;

	let hasPreviousState = false;
	let previousPlayerHp = 0;
	let previousPlayerBlock = 0;
	let previousEnemyHp = 0;
	let previousEnemyBlock = 0;
	let previousTurn = 0;
	let previousEncounter = 0;
	let previousPhase: typeof game.phase = 'playing';
	let previousEnemyIntent: typeof game.enemyIntent = { type: 'attack', amount: 0 };

	function format(text: string, values: Record<string, string | number>): string {
		return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
	}

	function showPlayerFeedback(kind: FeedbackKind, amount = 0) {
		playerFeedback = { id: ++feedbackId, amount, kind };
		if (playerFeedbackTimeout) clearTimeout(playerFeedbackTimeout);
		playerFeedbackTimeout = setTimeout(() => {
			playerFeedback = null;
			playerFeedbackTimeout = undefined;
		}, 900);
	}

	function showEnemyFeedback(kind: FeedbackKind, amount = 0) {
		enemyFeedback = { id: ++feedbackId, amount, kind };
		if (enemyFeedbackTimeout) clearTimeout(enemyFeedbackTimeout);
		enemyFeedbackTimeout = setTimeout(() => {
			enemyFeedback = null;
			enemyFeedbackTimeout = undefined;
		}, 900);
	}

	function animateEnemy(motion: EnemyMotion) {
		enemyMotion = motion;
		enemyMotionId += 1;
		if (enemyMotionTimeout) clearTimeout(enemyMotionTimeout);
		enemyMotionTimeout = setTimeout(() => {
			enemyMotion = null;
			enemyMotionTimeout = undefined;
		}, 550);
	}

	$effect(() => {
		const current = game;
		if (!hasPreviousState) {
			previousPlayerHp = current.playerHp;
			previousPlayerBlock = current.playerBlock;
			previousEnemyHp = current.enemyHp;
			previousEnemyBlock = current.enemyBlock;
			previousTurn = current.turn;
			previousEncounter = current.encounter;
			previousPhase = current.phase;
			previousEnemyIntent = current.enemyIntent;
			hasPreviousState = true;
			return;
		}

		if (current.phase !== previousPhase) {
			if (current.phase === 'victory') {
				stopCombatMusic();
				playPhaseMusic();
			} else if (current.phase === 'defeat') {
				stopCombatMusic();
			} else {
				startCombatMusic();
			}
		}

		const newRun =
			current.encounter === 0 &&
			current.turn === 1 &&
			current.playerHp === current.playerMaxHp &&
			current.enemyHp === current.enemyMaxHp &&
			(previousEncounter !== 0 || previousTurn !== 1 || previousPhase !== 'playing');
		const encounterChanged = current.encounter !== previousEncounter;
		const turnResolved =
			!encounterChanged &&
			(current.turn > previousTurn ||
				(current.phase === 'defeat' && previousPhase === 'playing'));

		if (turnResolved && previousEnemyIntent.type === 'attack') {
			animateEnemy('attack');
			const damage = Math.max(0, previousEnemyIntent.amount - previousPlayerBlock);
			if (damage === 0 && previousPlayerBlock > 0) showPlayerFeedback('blocked');
		} else if (turnResolved && previousEnemyIntent.type === 'guard') {
			animateEnemy('guard');
			const gainedBlock = current.enemyBlock - previousEnemyBlock;
			if (gainedBlock > 0) showEnemyFeedback('block', gainedBlock);
		}

		if (!newRun) {
			if (encounterChanged) {
				if (current.playerHp > previousPlayerHp) {
					showPlayerFeedback('heal', current.playerHp - previousPlayerHp);
				}
			} else {
				if (current.playerHp < previousPlayerHp) {
					showPlayerFeedback('damage', previousPlayerHp - current.playerHp);
				} else if (current.playerHp > previousPlayerHp) {
					showPlayerFeedback('heal', current.playerHp - previousPlayerHp);
				} else if (!turnResolved && current.playerBlock > previousPlayerBlock) {
					showPlayerFeedback('block', current.playerBlock - previousPlayerBlock);
				}

				if (current.enemyHp < previousEnemyHp) {
					showEnemyFeedback('damage', previousEnemyHp - current.enemyHp);
					if (!turnResolved) animateEnemy('hit');
				} else if (current.enemyBlock < previousEnemyBlock) {
					showEnemyFeedback('shield', previousEnemyBlock - current.enemyBlock);
					if (!turnResolved) animateEnemy('hit');
				}
			}
		}

		previousPlayerHp = current.playerHp;
		previousPlayerBlock = current.playerBlock;
		previousEnemyHp = current.enemyHp;
		previousEnemyBlock = current.enemyBlock;
		previousTurn = current.turn;
		previousEncounter = current.encounter;
		previousPhase = current.phase;
		previousEnemyIntent = current.enemyIntent;
	});

	onDestroy(() => {
		if (playerFeedbackTimeout) clearTimeout(playerFeedbackTimeout);
		if (enemyFeedbackTimeout) clearTimeout(enemyFeedbackTimeout);
		if (enemyMotionTimeout) clearTimeout(enemyMotionTimeout);
		stopCombatMusic();
	});

	function restartRun() {
		appState.game = createRun(true, appState.locale);
		startCombatMusic();
	}

	function handlePlayCard(cardId: string) {
		const current = appState.game;
		const card = current.hand.find((item) => item.id === cardId);
		if (!card) return;

		const next = playCard(current, cardId);
		if (next === current) return;

		if (card.cardKey === 'vitalDew') {
			if (next.playerHp > current.playerHp) playGameSound('heal');
		} else if (card.cardKey === 'emberBreath') {
			if (next.hand.length > current.hand.length - 1) playGameSound('draw');
		} else {
			playGameSound(cardSounds[card.cardKey]);
		}

		if (card.cardKey === 'lifeDrain' && next.playerHp > current.playerHp) {
			setTimeout(() => playGameSound('heal'), 180);
		}

		if (next.phase === 'playing') startCombatMusic();
		appState.game = next;
	}

	function handleEndTurn() {
		const current = appState.game;
		const next = endTurn(current);

		const enemyActionResolved = next.turn > current.turn || next.phase === 'defeat';
		if (enemyActionResolved && current.enemyIntent.type === 'attack') {
			playGameSound('punch');
		}
		if (next.turn > current.turn) playGameSound('draw');

		if (next.phase === 'playing') startCombatMusic();
		appState.game = next;
	}

	function handleAdvanceEncounter() {
		const current = appState.game;
		const next = advanceEncounter(current);
		if (next.playerHp > current.playerHp) playGameSound('heal');
		if (next.phase === 'playing') startCombatMusic();
		appState.game = next;
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

			{#key playerFeedback?.id ?? 0}
			<aside
				class="hero-panel"
				class:hero-hit={playerFeedback?.kind === 'damage'}
				class:hero-heal={playerFeedback?.kind === 'heal'}
				class:hero-blocked={playerFeedback?.kind === 'blocked' || playerFeedback?.kind === 'block'}
			>
				{#if playerFeedback}
					<span
						class="combat-feedback hero-feedback"
						class:feedback-heal={playerFeedback.kind === 'heal'}
						class:feedback-block={playerFeedback.kind === 'block' || playerFeedback.kind === 'blocked'}
						aria-hidden="true"
					>
						{#if playerFeedback.kind === 'damage'}
							−{playerFeedback.amount} {t.vitality}
						{:else if playerFeedback.kind === 'heal'}
							+{playerFeedback.amount} {t.vitality}
						{:else if playerFeedback.kind === 'block'}
							+{playerFeedback.amount} {t.block}
						{:else}
							{t.damageBlocked}
						{/if}
					</span>
				{/if}
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
			{/key}

			<div class="combat-center">
				<div class="enemy-intent" class:guarding={game.enemyIntent.type === 'guard'}>
					<span class="intent-icon">{game.enemyIntent.type === 'attack' ? '⌁' : '⬡'}</span>
					<div>
						<strong>{game.enemyIntent.type === 'attack' ? t.attackIntent : t.guardIntent}</strong>
						<span>{game.enemyIntent.type === 'attack' ? `${game.enemyIntent.amount} ${t.damage}` : `${game.enemyIntent.amount} ${t.guard}`}</span>
					</div>
				</div>

				{#key enemyMotionId}
					<div
						class="enemy-art"
						class:enemy-watcher={game.encounter === 0}
						class:enemy-witch={game.encounter === 1}
						class:enemy-boss={game.encounter === 2}
						class:enemy-hit={enemyMotion === 'hit'}
						class:enemy-attacking={enemyMotion === 'attack'}
						class:enemy-guarding={enemyMotion === 'guard'}
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
						{#if enemyFeedback}
							<span
								class="combat-feedback enemy-feedback"
								class:feedback-heal={enemyFeedback.kind === 'heal'}
								class:feedback-block={enemyFeedback.kind === 'block' || enemyFeedback.kind === 'shield'}
								aria-hidden="true"
							>
								{#if enemyFeedback.kind === 'damage'}
									−{enemyFeedback.amount} {t.damage}
								{:else if enemyFeedback.kind === 'shield'}
									−{enemyFeedback.amount} {t.block}
								{:else}
									+{enemyFeedback.amount} {t.block}
								{/if}
							</span>
						{/if}
					</div>
				{/key}

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
						onclick={() => handlePlayCard(card.id)}
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
					<button class="end-turn" onclick={handleEndTurn}>{t.endTurn} <span>→</span></button>
				{:else}
					<div class="result-banner" class:victory={game.phase === 'victory'}>
						<strong>{game.phase === 'victory' ? game.encounter === game.totalEncounters - 1 ? t.journeyComplete : t.stageComplete : t.journeyOver}</strong>
						{#if game.phase === 'victory' && game.encounter < game.totalEncounters - 1}
							<button onclick={handleAdvanceEncounter}>{t.nextStage} <span>→</span></button>
						{:else}
							<button onclick={restartRun}>{t.playAgain} <span>↻</span></button>
						{/if}
					</div>
				{/if}
				<div class="deck-hint">{t.cardHint}</div>
			</div>
		</section>
</main>
