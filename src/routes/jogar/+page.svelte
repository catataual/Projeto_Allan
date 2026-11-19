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
		stopCombatMusic,
		stopPhaseMusic,
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
	type GameSnapshot = Pick<
		typeof game,
		'playerHp' | 'playerBlock' | 'enemyHp' | 'enemyBlock' | 'turn' | 'encounter' | 'phase' | 'enemyIntent'
	>;

	function snapshotGame(state: GameSnapshot): GameSnapshot {
		return { ...state, enemyIntent: { ...state.enemyIntent } };
	}

	let playerFeedback = $state<CombatFeedback | null>(null);
	let enemyFeedback = $state<CombatFeedback | null>(null);
	let enemyMotion = $state<EnemyMotion | null>(null);
	let enemyMotionId = $state(0);
	let feedbackId = 0;
	let playerFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;
	let enemyFeedbackTimeout: ReturnType<typeof setTimeout> | undefined;
	let enemyMotionTimeout: ReturnType<typeof setTimeout> | undefined;
	let healSoundTimeout: ReturnType<typeof setTimeout> | undefined;

	let previousState: GameSnapshot | undefined;

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
		const previous = previousState;
		if (!previous) {
			previousState = snapshotGame(current);
			return;
		}

		if (current.phase !== previous.phase) {
			if (current.phase === 'victory') {
				stopCombatMusic();
				playPhaseMusic();
			} else if (current.phase === 'defeat') {
				stopCombatMusic();
			}
		}

		const newRun =
			current.encounter === 0 &&
			current.turn === 1 &&
			current.playerHp === current.playerMaxHp &&
			current.enemyHp === current.enemyMaxHp &&
			(previous.encounter !== 0 || previous.turn !== 1 || previous.phase !== 'playing');
		const encounterChanged = current.encounter !== previous.encounter;
		const turnResolved =
			!encounterChanged &&
			(current.turn > previous.turn ||
				(current.phase === 'defeat' && previous.phase === 'playing'));

		if (turnResolved && previous.enemyIntent.type === 'attack') {
			animateEnemy('attack');
			const damage = Math.max(0, previous.enemyIntent.amount - previous.playerBlock);
			if (damage === 0 && previous.playerBlock > 0) showPlayerFeedback('blocked');
		} else if (turnResolved && previous.enemyIntent.type === 'guard') {
			animateEnemy('guard');
			const gainedBlock = current.enemyBlock - previous.enemyBlock;
			if (gainedBlock > 0) showEnemyFeedback('block', gainedBlock);
		}

		if (!newRun) {
			if (encounterChanged) {
				if (current.playerHp > previous.playerHp) {
					showPlayerFeedback('heal', current.playerHp - previous.playerHp);
				}
			} else {
				if (current.playerHp < previous.playerHp) {
					showPlayerFeedback('damage', previous.playerHp - current.playerHp);
				} else if (current.playerHp > previous.playerHp) {
					showPlayerFeedback('heal', current.playerHp - previous.playerHp);
				} else if (!turnResolved && current.playerBlock > previous.playerBlock) {
					showPlayerFeedback('block', current.playerBlock - previous.playerBlock);
				}

				if (current.enemyHp < previous.enemyHp) {
					showEnemyFeedback('damage', previous.enemyHp - current.enemyHp);
					if (!turnResolved) animateEnemy('hit');
				} else if (current.enemyBlock < previous.enemyBlock) {
					showEnemyFeedback('shield', previous.enemyBlock - current.enemyBlock);
					if (!turnResolved) animateEnemy('hit');
				}
			}
		}

		previousState = snapshotGame(current);
	});

	onDestroy(() => {
		if (playerFeedbackTimeout) clearTimeout(playerFeedbackTimeout);
		if (enemyFeedbackTimeout) clearTimeout(enemyFeedbackTimeout);
		if (enemyMotionTimeout) clearTimeout(enemyMotionTimeout);
		if (healSoundTimeout) clearTimeout(healSoundTimeout);
		stopCombatMusic();
		stopPhaseMusic();
	});

	function restartRun() {
		appState.game = createRun(true, appState.locale);
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
			if (healSoundTimeout) clearTimeout(healSoundTimeout);
			healSoundTimeout = setTimeout(() => {
				healSoundTimeout = undefined;
				playGameSound('heal');
			}, 180);
		}

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

		appState.game = next;
	}

	function handleAdvanceEncounter() {
		const current = appState.game;
		const next = advanceEncounter(current);
		if (next.playerHp > current.playerHp) playGameSound('heal');
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
