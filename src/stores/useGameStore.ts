import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

interface Caret {
	caretIdx: number
	wordIdx: number
}

interface Player {
	id: string
	playerName: string
	progress: {
		caret: Caret
	}
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

interface GameState {
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

export const useGameStore = create<GameState>((set, get) => ({
	socket: null,
	roomId: null,
	players: [],
	config: null,
	connected: false,
	playerName: null,
	error: { type: '', message: '' },

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

		socket.on(
			'updateCaretFromServer',
			(payload: { playerId: string; caret: Caret }) => {
				set(state => ({
					players: state.players.map(p =>
						p.id === payload.playerId
							? {
									...p,
									progress: {
										...p.progress,
										caret: payload.caret,
									},
								}
							: p
					),
				}))
			}
		)

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
		get().socket?.emit('createRoom', { playerName: playerName })
	},

	joinRoom: (roomId: string, playerName: string) => {
		get().socket?.emit('joinRoom', { roomId, playerName })
	},

	updateCaret: (caret: Caret, roomId: string) => {
		const socket = get().socket
		if (!socket) return

		set(state => ({
			players: state.players.map(p =>
				p.id === socket.id ? { ...p, progress: { caret } } : p
			),
		}))

		socket.emit('caretUpdate', {
			caretIdx: caret.caretIdx,
			wordIdx: caret.wordIdx,
			roomId,
		})
	},
}))
