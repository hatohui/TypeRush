import { create } from 'zustand'
import { io } from 'socket.io-client'
import type { Caret, Player, GameState, Room, Error } from '../common/types.ts'

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
