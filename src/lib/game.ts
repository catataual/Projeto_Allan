import type { Locale } from './i18n.js';

export type CardEffect =
	| { type: 'damage'; amount: number }
	| { type: 'block'; amount: number }
	| { type: 'heal'; amount: number }
	| { type: 'poison'; amount: number; turns: number }
	| { type: 'draw'; amount: number }
	| { type: 'drain'; damage: number; heal: number };

export type Card = {
	id: string;
	cardKey: keyof typeof CARD_LIBRARY;
	name: string;
	cost: number;
	description: string;
	glyph: string;
	effect: CardEffect;
};

export type EnemyIntent = { type: 'attack' | 'guard'; amount: number };
export type GamePhase = 'playing' | 'victory' | 'defeat';

export type GameState = {
	playerHp: number;
	playerMaxHp: number;
	playerBlock: number;
	energy: number;
	turn: number;
	enemyHp: number;
	enemyMaxHp: number;
	enemyBlock: number;
	enemyPoison: number;
	enemyPoisonTurns: number;
	enemyName: string;
	enemyTitle: string;
	stageName: string;
	encounter: number;
	totalEncounters: number;
	locale: Locale;
	enemyIntent: EnemyIntent;
	phase: GamePhase;
	drawPile: Card[];
	discardPile: Card[];
	hand: Card[];
	log: string[];
};

type CardTemplate = Omit<Card, 'id'>;
type LocalizedText = Record<Locale, string>;

type CardDefinition = Omit<CardTemplate, 'cardKey' | 'name' | 'description'> & {
	name: LocalizedText;
	description: LocalizedText;
};

const CARD_LIBRARY = {
	ashBlade: {
		name: { pt: 'Lâmina de Cinza', en: 'Ashen Blade' },
		cost: 1,
		description: { pt: 'Cause 7 de dano.', en: 'Deal 7 damage.' },
		glyph: '⚔',
		effect: { type: 'damage', amount: 7 }
	},
	ironStance: {
		name: { pt: 'Postura de Ferro', en: 'Iron Stance' },
		cost: 1,
		description: { pt: 'Ganhe 6 de bloqueio.', en: 'Gain 6 block.' },
		glyph: '⬡',
		effect: { type: 'block', amount: 6 }
	},
	breaker: {
		name: { pt: 'Ruptura', en: 'Rend' },
		cost: 2,
		description: { pt: 'Cause 14 de dano.', en: 'Deal 14 damage.' },
		glyph: '✦',
		effect: { type: 'damage', amount: 14 }
	},
	vitalDew: {
		name: { pt: 'Orvalho Vital', en: 'Vital Dew' },
		cost: 1,
		description: { pt: 'Recupere 5 de vida.', en: 'Restore 5 health.' },
		glyph: '✧',
		effect: { type: 'heal', amount: 5 }
	},
	poisonThorns: {
		name: { pt: 'Espinhos Venenosos', en: 'Poison Thorns' },
		cost: 1,
		description: { pt: 'Envenene: 3 de dano por 3 turnos.', en: 'Poison: 3 damage for 3 turns.' },
		glyph: '☠',
		effect: { type: 'poison', amount: 3, turns: 3 }
	},
	emberBreath: {
		name: { pt: 'Fôlego da Brasa', en: 'Ember Breath' },
		cost: 1,
		description: { pt: 'Compre 2 cartas.', en: 'Draw 2 cards.' },
		glyph: '⟳',
		effect: { type: 'draw', amount: 2 }
	},
	lifeDrain: {
		name: { pt: 'Dreno Vital', en: 'Life Drain' },
		cost: 2,
		description: { pt: 'Cause 8 de dano e recupere 4 de vida.', en: 'Deal 8 damage and restore 4 health.' },
		glyph: '♧',
		effect: { type: 'drain', damage: 8, heal: 4 }
	}
} satisfies Record<string, CardDefinition>;

const STARTING_DECK: [keyof typeof CARD_LIBRARY, number][] = [
	['ashBlade', 5],
	['ironStance', 4],
	['breaker', 2],
	['vitalDew', 1],
	['poisonThorns', 1],
	['emberBreath', 1],
	['lifeDrain', 1]
];

const ENCOUNTERS = [
	{
		stageName: { pt: 'AS TERRAS AFUNDADAS', en: 'THE SUNKEN LANDS' },
		enemyName: { pt: 'O Vigia Oco', en: 'The Hollow Watcher' },
		enemyTitle: { pt: 'GUARDIÃO DA PASSAGEM', en: 'GATEKEEPER' },
		enemyMaxHp: 52,
		minAttack: 9,
		maxAttack: 11,
		guardAmount: 6,
		guardEvery: 3
	},
	{
		stageName: { pt: 'O BREJO DOS SUSSURROS', en: 'THE WHISPERING MARSH' },
		enemyName: { pt: 'A Bruxa do Brejo', en: 'The Marsh Witch' },
		enemyTitle: { pt: 'TECELÃ DE RAÍZES', en: 'ROOT WEAVER' },
		enemyMaxHp: 64,
		minAttack: 10,
		maxAttack: 13,
		guardAmount: 7,
		guardEvery: 3
	},
	{
		stageName: { pt: 'O ALTAR DAS CINZAS', en: 'THE ALTAR OF ASH' },
		enemyName: { pt: 'O Cervo de Cinzas', en: 'The Ashen Stag' },
		enemyTitle: { pt: 'SENHOR DO ALTAR', en: 'LORD OF THE ALTAR' },
		enemyMaxHp: 78,
		minAttack: 12,
		maxAttack: 15,
		guardAmount: 9,
		guardEvery: 4
	}
] as const;

function shuffle<T>(items: T[]): T[] {
	const result = [...items];

	for (let index = result.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[result[index], result[swapIndex]] = [result[swapIndex], result[index]];
	}

	return result;
}

function makeEnemyIntent(turn: number, encounter: number, randomize = true): EnemyIntent {
	const stats = ENCOUNTERS[encounter];
	if (turn % stats.guardEvery === 0) return { type: 'guard', amount: stats.guardAmount };
	const damage = randomize
		? stats.minAttack + Math.floor(Math.random() * (stats.maxAttack - stats.minAttack + 1))
		: stats.minAttack;
	return { type: 'attack', amount: damage };
}

function addLog(state: GameState, message: string): GameState {
	return { ...state, log: [message, ...state.log].slice(0, 4) };
}

function localized(locale: Locale, pt: string, en: string): string {
	return locale === 'pt' ? pt : en;
}

function addLocalizedLog(state: GameState, pt: string, en: string): GameState {
	return addLog(state, localized(state.locale, pt, en));
}

function drawCards(state: GameState, count: number): GameState {
	let drawPile = [...state.drawPile];
	const discardPile = [...state.discardPile];
	const hand = [...state.hand];

	for (let index = 0; index < count; index += 1) {
		if (drawPile.length === 0) {
			if (discardPile.length === 0) break;
			drawPile = shuffle(discardPile.splice(0));
		}

		const card = drawPile.pop();
		if (card) hand.push(card);
	}

	return { ...state, drawPile, discardPile, hand };
}

function createCard(cardKey: keyof typeof CARD_LIBRARY, id: string, locale: Locale): Card {
	const definition = CARD_LIBRARY[cardKey];
	return {
		...definition,
		cardKey,
		id,
		name: definition.name[locale],
		description: definition.description[locale]
	};
}

export function createRun(randomize = true, locale: Locale = 'pt'): GameState {
	let nextCardId = 0;
	const cards = STARTING_DECK.flatMap(([cardKey, copies]) =>
		Array.from({ length: copies }, () => createCard(cardKey, `card-${nextCardId++}`, locale))
	);
	const drawPile = randomize ? shuffle(cards) : cards;
	const firstEncounter = ENCOUNTERS[0];
	const initialState: GameState = {
		playerHp: 66,
		playerMaxHp: 66,
		playerBlock: 0,
		energy: 3,
		turn: 1,
		enemyHp: firstEncounter.enemyMaxHp,
		enemyMaxHp: firstEncounter.enemyMaxHp,
		enemyBlock: 0,
		enemyPoison: 0,
		enemyPoisonTurns: 0,
		enemyName: firstEncounter.enemyName[locale],
		enemyTitle: firstEncounter.enemyTitle[locale],
		stageName: firstEncounter.stageName[locale],
		encounter: 0,
		totalEncounters: ENCOUNTERS.length,
		locale,
		enemyIntent: makeEnemyIntent(1, 0, randomize),
		phase: 'playing',
		drawPile,
		discardPile: [],
		hand: [],
		log: [
			localized(
				locale,
				`A névoa se move. ${firstEncounter.enemyName.pt} prepara o próximo golpe.`,
				`The mist shifts. ${firstEncounter.enemyName.en} prepares to strike.`
			)
		]
	};

	return drawCards(initialState, 5);
}

export function playCard(state: GameState, cardId: string): GameState {
	const card = state.hand.find((item) => item.id === cardId);
	if (!card || state.phase !== 'playing' || card.cost > state.energy) return state;

	let next: GameState = {
		...state,
		energy: state.energy - card.cost,
		hand: state.hand.filter((item) => item.id !== cardId),
		discardPile: [...state.discardPile, card]
	};

	if (card.effect.type === 'damage') {
		const absorbed = Math.min(next.enemyBlock, card.effect.amount);
		const damage = card.effect.amount - absorbed;
		next = {
			...next,
			enemyHp: Math.max(0, next.enemyHp - damage),
			enemyBlock: next.enemyBlock - absorbed
		};
		next = addLocalizedLog(
			next,
			`${card.name}: ${damage} de dano a ${next.enemyName}.`,
			`${card.name}: ${damage} damage to ${next.enemyName}.`
		);
	} else if (card.effect.type === 'block') {
		next = { ...next, playerBlock: next.playerBlock + card.effect.amount };
		next = addLocalizedLog(
			next,
			`${card.name}: +${card.effect.amount} de bloqueio.`,
			`${card.name}: +${card.effect.amount} block.`
		);
	} else if (card.effect.type === 'heal') {
		const healed = Math.min(card.effect.amount, next.playerMaxHp - next.playerHp);
		next = { ...next, playerHp: next.playerHp + healed };
		next = addLocalizedLog(
			next,
			`${card.name}: recuperou ${healed} de vida.`,
			`${card.name}: restored ${healed} health.`
		);
	} else if (card.effect.type === 'poison') {
		next = {
			...next,
			enemyPoison: next.enemyPoison + card.effect.amount,
			enemyPoisonTurns: Math.max(next.enemyPoisonTurns, card.effect.turns)
		};
		next = addLocalizedLog(
			next,
			`${card.name}: ${next.enemyName} foi envenenado.`,
			`${card.name}: ${next.enemyName} is poisoned.`
		);
	} else if (card.effect.type === 'draw') {
		next = drawCards(next, card.effect.amount);
		next = addLocalizedLog(
			next,
			`${card.name}: comprou ${card.effect.amount} cartas.`,
			`${card.name}: drew ${card.effect.amount} cards.`
		);
	} else {
		const absorbed = Math.min(next.enemyBlock, card.effect.damage);
		const damage = card.effect.damage - absorbed;
		const healed = Math.min(card.effect.heal, next.playerMaxHp - next.playerHp);
		next = {
			...next,
			enemyHp: Math.max(0, next.enemyHp - damage),
			enemyBlock: next.enemyBlock - absorbed,
			playerHp: next.playerHp + healed
		};
		next = addLocalizedLog(
			next,
			`${card.name}: ${damage} de dano e +${healed} de vida.`,
			`${card.name}: ${damage} damage and +${healed} health.`
		);
	}

	if (next.enemyHp === 0) {
		next = { ...next, phase: 'victory' };
		next = addLocalizedLog(
			next,
			`${next.enemyName} caiu. A passagem está livre.`,
			`${next.enemyName} falls. The path is clear.`
		);
	}

	return next;
}

export function advanceEncounter(state: GameState): GameState {
	const nextEncounter = state.encounter + 1;
	const nextStats = ENCOUNTERS[nextEncounter];
	if (state.phase !== 'victory' || !nextStats) return state;

	const next: GameState = {
		...state,
		playerHp: Math.min(state.playerMaxHp, state.playerHp + 8),
		playerBlock: 0,
		energy: 3,
		turn: 1,
		enemyHp: nextStats.enemyMaxHp,
		enemyMaxHp: nextStats.enemyMaxHp,
		enemyBlock: 0,
		enemyPoison: 0,
		enemyPoisonTurns: 0,
		enemyName: nextStats.enemyName[state.locale],
		enemyTitle: nextStats.enemyTitle[state.locale],
		stageName: nextStats.stageName[state.locale],
		encounter: nextEncounter,
		enemyIntent: makeEnemyIntent(1, nextEncounter),
		phase: 'playing',
		discardPile: [...state.discardPile, ...state.hand],
		hand: [],
		log: [
			localized(
				state.locale,
				`Uma brasa restaura 8 de vida. ${nextStats.enemyName.pt} surge à frente.`,
				`An ember restores 8 health. ${nextStats.enemyName.en} appears ahead.`
			)
		]
	};

	return drawCards(next, 5);
}

export function setGameLocale(state: GameState, locale: Locale): GameState {
	if (state.locale === locale) return state;

	const localizeCards = (cards: Card[]) =>
		cards.map((card) => createCard(card.cardKey, card.id, locale));
	const encounter = ENCOUNTERS[state.encounter];

	return {
		...state,
		locale,
		enemyName: encounter.enemyName[locale],
		enemyTitle: encounter.enemyTitle[locale],
		stageName: encounter.stageName[locale],
		drawPile: localizeCards(state.drawPile),
		discardPile: localizeCards(state.discardPile),
		hand: localizeCards(state.hand),
		log: []
	};
}

export function endTurn(state: GameState): GameState {
	if (state.phase !== 'playing') return state;

	let next = { ...state };
	if (state.enemyPoison > 0 && state.enemyPoisonTurns > 0) {
		next = {
			...next,
			enemyHp: Math.max(0, next.enemyHp - state.enemyPoison),
			enemyPoisonTurns: state.enemyPoisonTurns - 1
		};
		next = addLocalizedLog(
			next,
			`${state.enemyName} sofre ${state.enemyPoison} de dano venenoso.`,
			`${state.enemyName} takes ${state.enemyPoison} poison damage.`
		);
		if (next.enemyPoisonTurns === 0) next = { ...next, enemyPoison: 0 };
		if (next.enemyHp === 0) {
			next = { ...next, phase: 'victory' };
			next = addLocalizedLog(
				next,
				`${state.enemyName} sucumbiu ao veneno.`,
				`${state.enemyName} succumbs to the poison.`
			);
			return next;
		}
	}

	if (state.enemyIntent.type === 'attack') {
		const damage = Math.max(0, state.enemyIntent.amount - state.playerBlock);
		next = { ...next, playerHp: Math.max(0, state.playerHp - damage) };
		next = addLocalizedLog(
			next,
			`${state.enemyName} ataca: ${damage} de dano recebido.`,
			`${state.enemyName} attacks: you take ${damage} damage.`
		);
	} else {
		next = { ...next, enemyBlock: next.enemyBlock + state.enemyIntent.amount };
		next = addLocalizedLog(
			next,
			`${state.enemyName} se protege: +${state.enemyIntent.amount} de bloqueio.`,
			`${state.enemyName} guards: +${state.enemyIntent.amount} block.`
		);
	}

	if (next.playerHp === 0) {
		return { ...next, phase: 'defeat', playerBlock: 0 };
	}

	const nextTurn = state.turn + 1;
	next = {
		...next,
		playerBlock: 0,
		energy: 3,
		turn: nextTurn,
		enemyIntent: makeEnemyIntent(nextTurn, state.encounter),
		hand: [],
		discardPile: [...next.discardPile, ...next.hand]
	};
	next = drawCards(next, 5);

	return next;
}
