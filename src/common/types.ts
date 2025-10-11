import { Socket } from 'socket.io-client'

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

	connect: () => void
	createRoom: (playerName: string) => void
	joinRoom: (roomId: string, name: string) => void
	updateCaret: (caret: Caret, roomId: string) => void
	startGame: (roomId: string | null) => void
	stopGame: (roomId: string | null) => void
	setIsGameStarted: (isGameStarted: boolean) => void
	setRenderStartModal: (renderStartModal: boolean) => void
	handleFinish: (roomId: string | null, stats: PlayerStats) => void
}

export interface MainGameContainerProps {
	words: string[]
	mode: 'practice' | 'multiplayer'
}
