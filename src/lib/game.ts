export type CardEffect =
	| { type: 'damage'; amount: number }
	| { type: 'block'; amount: number }
	| { type: 'heal'; amount: number };

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
	enemyIntent: EnemyIntent;
	phase: GamePhase;
	drawPile: Card[];
	discardPile: Card[];
	hand: Card[];
	log: string[];
};

type CardTemplate = Omit<Card, 'id'>;

const STARTING_CARDS: CardTemplate[] = [
	{
		name: 'Lâmina de Cinza',
		cost: 1,
		description: 'Cause 7 de dano.',
		glyph: '⚔',
		effect: { type: 'damage', amount: 7 }
	},
	{
		name: 'Lâmina de Cinza',
		cost: 1,
		description: 'Cause 7 de dano.',
		glyph: '⚔',
		effect: { type: 'damage', amount: 7 }
	},
	{
		name: 'Lâmina de Cinza',
		cost: 1,
		description: 'Cause 7 de dano.',
		glyph: '⚔',
		effect: { type: 'damage', amount: 7 }
	},
	{
		name: 'Lâmina de Cinza',
		cost: 1,
		description: 'Cause 7 de dano.',
		glyph: '⚔',
		effect: { type: 'damage', amount: 7 }
	},
	{
		name: 'Lâmina de Cinza',
		cost: 1,
		description: 'Cause 7 de dano.',
		glyph: '⚔',
		effect: { type: 'damage', amount: 7 }
	},
	{
		name: 'Postura de Ferro',
		cost: 1,
		description: 'Ganhe 6 de bloqueio.',
		glyph: '⬡',
		effect: { type: 'block', amount: 6 }
	},
	{
		name: 'Postura de Ferro',
		cost: 1,
		description: 'Ganhe 6 de bloqueio.',
		glyph: '⬡',
		effect: { type: 'block', amount: 6 }
	},
	{
		name: 'Postura de Ferro',
		cost: 1,
		description: 'Ganhe 6 de bloqueio.',
		glyph: '⬡',
		effect: { type: 'block', amount: 6 }
	},
	{
		name: 'Postura de Ferro',
		cost: 1,
		description: 'Ganhe 6 de bloqueio.',
		glyph: '⬡',
		effect: { type: 'block', amount: 6 }
	},
	{
		name: 'Ruptura',
		cost: 2,
		description: 'Cause 14 de dano.',
		glyph: '✦',
		effect: { type: 'damage', amount: 14 }
	},
	{
		name: 'Ruptura',
		cost: 2,
		description: 'Cause 14 de dano.',
		glyph: '✦',
		effect: { type: 'damage', amount: 14 }
	},
	{
		name: 'Orvalho Vital',
		cost: 1,
		description: 'Recupere 5 de vida.',
		glyph: '✧',
		effect: { type: 'heal', amount: 5 }
	}
];

function shuffle<T>(items: T[]): T[] {
	const result = [...items];

	for (let index = result.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[result[index], result[swapIndex]] = [result[swapIndex], result[index]];
	}

	return result;
}

function makeEnemyIntent(turn: number, randomize = true): EnemyIntent {
	if (turn % 3 === 0) return { type: 'guard', amount: 6 };
	return { type: 'attack', amount: randomize ? 8 + Math.floor(Math.random() * 4) : 10 };
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
	const cards = STARTING_CARDS.map((card, index) => ({ ...card, id: `card-${index}` }));
	const drawPile = randomize ? shuffle(cards) : cards;
	const initialState: GameState = {
		playerHp: 70,
		playerMaxHp: 70,
		playerBlock: 0,
		energy: 3,
		turn: 1,
		enemyHp: 48,
		enemyMaxHp: 48,
		enemyBlock: 0,
		enemyIntent: makeEnemyIntent(1, randomize),
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
		next = addLog(next, `${card.name}: ${damage} de dano ao Vigia Oco.`);
	} else if (card.effect.type === 'block') {
		next = { ...next, playerBlock: next.playerBlock + card.effect.amount };
		next = addLog(next, `${card.name}: +${card.effect.amount} de bloqueio.`);
	} else {
		const healed = Math.min(card.effect.amount, next.playerMaxHp - next.playerHp);
		next = { ...next, playerHp: next.playerHp + healed };
		next = addLog(next, `${card.name}: recuperou ${healed} de vida.`);
	}

	if (next.enemyHp === 0) {
		next = { ...next, phase: 'victory' };
		next = addLog(next, 'O Vigia Oco caiu. A trilha está livre.');
	}

	return next;
}

export function endTurn(state: GameState): GameState {
	if (state.phase !== 'playing') return state;

	let next = { ...state };
	if (state.enemyIntent.type === 'attack') {
		const damage = Math.max(0, state.enemyIntent.amount - state.playerBlock);
		next = { ...next, playerHp: Math.max(0, state.playerHp - damage) };
		next = addLog(next, `O Vigia Oco ataca: ${damage} de dano recebido.`);
	} else {
		next = { ...next, enemyBlock: next.enemyBlock + state.enemyIntent.amount };
		next = addLog(next, `O Vigia Oco se protege: +${state.enemyIntent.amount} de bloqueio.`);
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
		enemyIntent: makeEnemyIntent(nextTurn),
		hand: [],
		discardPile: [...next.discardPile, ...next.hand]
	};
	next = drawCards(next, 5);

	return next;
}
