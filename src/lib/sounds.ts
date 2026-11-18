export type GameSound = 'blade' | 'punch' | 'smoke' | 'heal' | 'shield' | 'draw';
type MusicTrack = 'menu' | 'combat' | 'phase';

const SOUND_FILES: Record<GameSound, string> = {
	blade: '/audio/blade.mp3',
	punch: '/audio/punch.mp3',
	smoke: '/audio/smoke.mp3',
	heal: '/audio/heal.mp3',
	shield: '/audio/shield.mp3',
	draw: '/audio/draw-cards.mp3'
};

const MUSIC_FILES: Record<MusicTrack, string> = {
	menu: '/audio/menu.mp3',
	combat: '/audio/fight.mp3',
	phase: '/audio/phase.mp3'
};

const players = new Map<GameSound, HTMLAudioElement>();
const musicPlayers = new Map<MusicTrack, HTMLAudioElement>();
let musicVolume = 0.3;
let musicMuted = false;

function playAudio(player: HTMLAudioElement, label: string): void {
	void player.play().catch((error: unknown) => {
		console.error(`Unable to play ${label}.`, error);
	});
}

function getMusicPlayer(track: MusicTrack): HTMLAudioElement | undefined {
	if (typeof Audio === 'undefined') return undefined;

	let player = musicPlayers.get(track);
	if (!player) {
		player = new Audio(MUSIC_FILES[track]);
		player.preload = 'auto';
		player.loop = track !== 'phase';
		player.volume = musicVolume;
		player.muted = musicMuted;
		musicPlayers.set(track, player);
	}

	return player;
}

function startMusic(track: Exclude<MusicTrack, 'phase'>): void {
	const player = getMusicPlayer(track);
	if (player?.paused) playAudio(player, `${track} music`);
}

function stopMusic(track: Exclude<MusicTrack, 'phase'>): void {
	const player = musicPlayers.get(track);
	if (!player) return;

	player.pause();
	player.currentTime = 0;
}

export function playGameSound(sound: GameSound): void {
	if (typeof Audio === 'undefined') return;

	let player = players.get(sound);
	if (!player) {
		player = new Audio(SOUND_FILES[sound]);
		player.preload = 'auto';
		player.volume = 0.55;
		players.set(sound, player);
	}

	player.currentTime = 0;
	playAudio(player, `the "${sound}" game sound`);
}

export function startCombatMusic(): void {
	startMusic('combat');
}

export function stopCombatMusic(): void {
	stopMusic('combat');
}

export function startMenuMusic(): void {
	startMusic('menu');
}

export function stopMenuMusic(): void {
	stopMusic('menu');
}

export function playPhaseMusic(): void {
	if (musicMuted || musicVolume === 0) return;

	const player = getMusicPlayer('phase');
	if (!player) return;
	player.currentTime = 0;
	playAudio(player, 'phase music');
}

export function setMusicVolume(volume: number): void {
	if (!Number.isFinite(volume)) throw new RangeError('Music volume must be a finite number.');

	musicVolume = Math.max(0, Math.min(1, volume));
	for (const player of musicPlayers.values()) player.volume = musicVolume;
}

export function setMusicMuted(muted: boolean): void {
	musicMuted = muted;
	for (const player of musicPlayers.values()) player.muted = muted;
}
