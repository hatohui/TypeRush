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
}

export interface GameConfig {
	words: string[]
	duration: number
}

export interface Room {
	roomId: string
	players: Player[]
	config: GameConfig
}

export interface Error {
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
	error: Error

	connect: () => void
	createRoom: (playerName: string) => void
	joinRoom: (roomId: string, name: string) => void
	updateCaret: (caret: Caret, roomId: string) => void
}
