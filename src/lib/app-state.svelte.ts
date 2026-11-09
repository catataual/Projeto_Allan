import type { GameState } from './game.js';
import type { Locale } from './i18n.js';

export const APP_STATE = Symbol('app-state');

export interface AppState {
	locale: Locale;
	game: GameState;
}
