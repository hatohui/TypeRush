import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

interface Player {
	id: string
	name: string
}

interface GameConfig {
	words: string[]
	duration: number
}

interface Room {
	roomId: string
	players: Player[]
	config: GameConfig
}

interface Error {
	type: string
	message: string
}

interface Caret {
	caretIdx: number
	wordIdx: number
	playerId: string
}

interface GameState {
	socket: Socket | null
	roomId: string | null
	players: Player[]
	config: GameConfig | null
	connected: boolean
	playerName: string | null
	error: Error
	opponentCaretIdx: number
	opponentWordIdx: number

	connect: () => void
	createRoom: (playerName: string) => void
	joinRoom: (roomId: string, name: string) => void
	updateProgress: (progress: number) => void
	updateOpponentCaret: (
		caretIdx: number,
		wordIdx: number,
		roomId: string
	) => void
}

export const useGameStore = create<GameState>((set, get) => ({
	socket: null,
	roomId: null,
	players: [],
	config: null,
	connected: false,
	playerName: null,
	error: { type: '', message: '' },
	opponentCaretIdx: -1,
	opponentWordIdx: 0,

	connect: () => {
		if (get().socket) return
		const socket = io('http://localhost:3000')
		set({ socket })

		socket.on('connect', () => {
			set({ connected: true, socket })
		})

		socket.on('roomCreated', (room: Room) => {
			set({ roomId: room.roomId, players: room.players, config: room.config })
		})

		socket.on('roomJoined', (room: Room) => {
			set({
				roomId: room.roomId,
				players: room.players,
				config: room.config,
				error: { type: '', message: '' },
			})
		})

		socket.on('errorEvent', (err: Error) => {
			set({ error: err })
		})

		socket.on('playerUpdate', (players: Player[]) => {
			set({ players })
		})

		socket.on('updateCaretFromServer', (caret: Caret) => {
			if (caret.playerId === socket.id) return
			set({ opponentWordIdx: caret.wordIdx, opponentCaretIdx: caret.caretIdx })
		})

		socket.on('disconnect', () => {
			set({
				connected: false,
				roomId: null,
				players: [],
				config: null,
				error: { type: '', message: '' },
			})
		})
	},

	createRoom: (playerName: string) => {
		get().socket?.emit('createRoom', { name: playerName })
	},

	joinRoom: (roomId: string, name: string) => {
		get().socket?.emit('joinRoom', { roomId, name })
	},

	updateProgress: (progress: number) => {
		get().socket?.emit('updateProgress', progress)
	},

	updateOpponentCaret: (caretIdx: number, wordIdx: number, roomId: string) => {
		get().socket?.emit('caretUpdate', { caretIdx, wordIdx, roomId })
	},
}))
