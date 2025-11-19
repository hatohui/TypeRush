import { Socket } from 'socket.io-client'
import type { GAME_DURATION } from './constant.ts'

export interface Caret {
	caretIdx: number
	wordIdx: number
}

export interface Player {
	id: string
	playerName: string
	progress: {
		caret: Caret
	}
	isHost: boolean
}

export interface GameConfig {
	words: string[]
	duration: number
}

export interface PlayerStats {
	accuracy: number
	wpm: number
	rawWpm: number
	correct: number
	incorrect: number
}

export interface RoomLeaderboardEntry {
	playerId: string
	stats: PlayerStats
}

export type Room = {
	roomId: string
	players: Player[]
	config: GameConfig
	leaderboard: RoomLeaderboardEntry[]
}

export interface GameError {
	type: string
	message: string
}

export interface GameState {
	socket: Socket | null
	roomId: string | null
	players: Player[]
	config: GameConfig | null
	connected: boolean
	playerName: string | null
	error: GameError
	isGameStarted: boolean
	renderStartModal: boolean
	isHost: boolean
	leaderboard: RoomLeaderboardEntry[]
	position: number | null
	displayFinishModal: boolean
	selectedDuration: number

	connect: () => void
	setSelectedDuration: (duration: number) => void
	createRoom: (playerName: string) => void
	joinRoom: (roomId: string, name: string) => void
	updateCaret: (caret: Caret, roomId: string) => void
	startGame: (roomId: string | null) => void
	stopGame: (roomId: string | null) => void
	setIsGameStarted: (isGameStarted: boolean) => void
	setRenderStartModal: (renderStartModal: boolean) => void
	handlePlayerFinish: (roomId: string | null, stats: PlayerStats) => void
	setDisplayFinishModal: (displayFinishModal: boolean) => void
}

export type GameDuration = (typeof GAME_DURATION)[number]

export interface MainGameContainerProps {
	words: string[]
	mode: 'practice' | 'multiplayer'
	duration: GameDuration
}

export const InputKey = {
	SPACE: ' ',
	BACKSPACE: 'Backspace',
	ARROW_LEFT: 'ArrowLeft',
	ARROW_RIGHT: 'ArrowRight',
	ARROW_UP: 'ArrowUp',
	ARROW_DOWN: 'ArrowDown',
	TAB: 'Tab',
	ENTER: 'Enter',
	ALT: 'Alt',
}

export const TypingMode = {
	PRACTICE: 'practice',
	MULTIPLAYER: 'multiplayer',
}

export const PlayerColor = {
	RED: '#ef4444',
	GREEN: '#22c55e',
	AMBER: '#f59e0b',
	BLUE: '#3b82f6',
	GRAY: '#6b7280',
}

export const CharacterState = {
	CORRECT: 'correct',
	INCORRECT: 'incorrect',
	UNTYPED: 'untyped',
}
