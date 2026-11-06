export type CardEffect =
	| { type: 'damage'; amount: number }
	| { type: 'block'; amount: number }
	| { type: 'heal'; amount: number }
	| { type: 'poison'; amount: number; turns: number }
	| { type: 'draw'; amount: number }
	| { type: 'drain'; damage: number; heal: number };

export type Card = {
	id: string;
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
	enemyIntent: EnemyIntent;
	phase: GamePhase;
	drawPile: Card[];
	discardPile: Card[];
	hand: Card[];
	log: string[];
};

type CardTemplate = Omit<Card, 'id'>;

const CARD_LIBRARY = {
	ashBlade: {
		name: 'Lâmina de Cinza',
		cost: 1,
		description: 'Cause 7 de dano.',
		glyph: '⚔',
		effect: { type: 'damage', amount: 7 }
	},
	ironStance: {
		name: 'Postura de Ferro',
		cost: 1,
		description: 'Ganhe 6 de bloqueio.',
		glyph: '⬡',
		effect: { type: 'block', amount: 6 }
	},
	breaker: {
		name: 'Ruptura',
		cost: 2,
		description: 'Cause 14 de dano.',
		glyph: '✦',
		effect: { type: 'damage', amount: 14 }
	},
	vitalDew: {
		name: 'Orvalho Vital',
		cost: 1,
		description: 'Recupere 5 de vida.',
		glyph: '✧',
		effect: { type: 'heal', amount: 5 }
	},
	poisonThorns: {
		name: 'Espinhos Venenosos',
		cost: 1,
		description: 'Envenene: 3 de dano por 3 turnos.',
		glyph: '☠',
		effect: { type: 'poison', amount: 3, turns: 3 }
	},
	emberBreath: {
		name: 'Fôlego da Brasa',
		cost: 1,
		description: 'Compre 2 cartas.',
		glyph: '⟳',
		effect: { type: 'draw', amount: 2 }
	},
	lifeDrain: {
		name: 'Dreno Vital',
		cost: 2,
		description: 'Cause 8 de dano e recupere 4 de vida.',
		glyph: '♧',
		effect: { type: 'drain', damage: 8, heal: 4 }
	}
} satisfies Record<string, CardTemplate>;

const STARTING_DECK: [CardTemplate, number][] = [
	[CARD_LIBRARY.ashBlade, 5],
	[CARD_LIBRARY.ironStance, 4],
	[CARD_LIBRARY.breaker, 2],
	[CARD_LIBRARY.vitalDew, 1],
	[CARD_LIBRARY.poisonThorns, 1],
	[CARD_LIBRARY.emberBreath, 1],
	[CARD_LIBRARY.lifeDrain, 1]
];

const ENCOUNTERS = [
	{
		stageName: 'AS TERRAS AFUNDADAS',
		enemyName: 'O Vigia Oco',
		enemyTitle: 'GUARDIÃO DA PASSAGEM',
		enemyMaxHp: 52,
		minAttack: 9,
		maxAttack: 11,
		guardAmount: 6,
		guardEvery: 3
	},
	{
		stageName: 'O BREJO DOS SUSSURROS',
		enemyName: 'A Bruxa do Brejo',
		enemyTitle: 'TECELÃ DE RAÍZES',
		enemyMaxHp: 64,
		minAttack: 10,
		maxAttack: 13,
		guardAmount: 7,
		guardEvery: 3
	},
	{
		stageName: 'O ALTAR DAS CINZAS',
		enemyName: 'O Cervo de Cinzas',
		enemyTitle: 'SENHOR DO ALTAR',
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

export function createRun(randomize = true): GameState {
	let nextCardId = 0;
	const cards = STARTING_DECK.flatMap(([card, copies]) =>
		Array.from({ length: copies }, () => ({ ...card, id: `card-${nextCardId++}` }))
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
		enemyName: firstEncounter.enemyName,
		enemyTitle: firstEncounter.enemyTitle,
		stageName: firstEncounter.stageName,
		encounter: 0,
		totalEncounters: ENCOUNTERS.length,
		enemyIntent: makeEnemyIntent(1, 0, randomize),
		phase: 'playing',
		drawPile,
		discardPile: [],
		hand: [],
		log: ['A névoa se move. O Vigia Oco prepara o próximo golpe.']
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
		next = addLog(next, `${card.name}: ${damage} de dano a ${next.enemyName}.`);
	} else if (card.effect.type === 'block') {
		next = { ...next, playerBlock: next.playerBlock + card.effect.amount };
		next = addLog(next, `${card.name}: +${card.effect.amount} de bloqueio.`);
	} else if (card.effect.type === 'heal') {
		const healed = Math.min(card.effect.amount, next.playerMaxHp - next.playerHp);
		next = { ...next, playerHp: next.playerHp + healed };
		next = addLog(next, `${card.name}: recuperou ${healed} de vida.`);
	} else if (card.effect.type === 'poison') {
		next = {
			...next,
			enemyPoison: next.enemyPoison + card.effect.amount,
			enemyPoisonTurns: Math.max(next.enemyPoisonTurns, card.effect.turns)
		};
		next = addLog(next, `${card.name}: ${next.enemyName} foi envenenado.`);
	} else if (card.effect.type === 'draw') {
		next = drawCards(next, card.effect.amount);
		next = addLog(next, `${card.name}: comprou ${card.effect.amount} cartas.`);
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
		next = addLog(next, `${card.name}: ${damage} de dano e +${healed} de vida.`);
	}

	if (next.enemyHp === 0) {
		next = { ...next, phase: 'victory' };
		next = addLog(next, `${next.enemyName} caiu. A passagem está livre.`);
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
		enemyName: nextStats.enemyName,
		enemyTitle: nextStats.enemyTitle,
		stageName: nextStats.stageName,
		encounter: nextEncounter,
		enemyIntent: makeEnemyIntent(1, nextEncounter),
		phase: 'playing',
		discardPile: [...state.discardPile, ...state.hand],
		hand: [],
		log: [`Uma brasa restaura 8 de vida. ${nextStats.enemyName} surge à frente.`]
	};

	return drawCards(next, 5);
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
		next = addLog(next, `${state.enemyName} sofre ${state.enemyPoison} de dano venenoso.`);
		if (next.enemyPoisonTurns === 0) next = { ...next, enemyPoison: 0 };
		if (next.enemyHp === 0) {
			next = { ...next, phase: 'victory' };
			next = addLog(next, `${state.enemyName} sucumbiu ao veneno.`);
			return next;
		}
	}

	if (state.enemyIntent.type === 'attack') {
		const damage = Math.max(0, state.enemyIntent.amount - state.playerBlock);
		next = { ...next, playerHp: Math.max(0, state.playerHp - damage) };
		next = addLog(next, `${state.enemyName} ataca: ${damage} de dano recebido.`);
	} else {
		next = { ...next, enemyBlock: next.enemyBlock + state.enemyIntent.amount };
		next = addLog(next, `${state.enemyName} se protege: +${state.enemyIntent.amount} de bloqueio.`);
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
