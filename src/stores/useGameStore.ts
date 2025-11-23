import { create } from 'zustand'
import { io } from 'socket.io-client'
import type {
	Caret,
	Player,
	GameState,
	Room,
	GameError,
	PlayerStats,
	GameConfig,
	WaveRushRoundResultType,
	WaveRushGameResult,
} from '../common/types.ts'

export const useGameStore = create<GameState>((set, get) => ({
	socket: null,
	roomId: null,
	players: [],
	config: null,
	connected: false,
	playerName: null,
	error: { type: '', message: '' },
	isGameStarted: false,
	renderStartModal: false,
	isHost: false,
	leaderboard: [],
	position: null,
	displayFinishModal: false,
	selectedDuration: 15,
	waveRushGameResult: {
		byPlayer: {},
		byRound: {},
		currentRound: 0,
	},

	connect: () => {
		if (get().socket) return
		const socket = io(
			import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
		)
		set({ socket })

		socket.on('connect', () => {
			set({ connected: true, socket })
		})

		socket.on('roomCreated', (room: Room) => {
			set({
				roomId: room.roomId,
				players: room.players,
				config: room.config,
				isHost: true,
			})
		})

		socket.on('roomJoined', (room: Room) => {
			set({
				roomId: room.roomId,
				players: room.players,
				config: room.config,
				error: { type: '', message: '' },
			})
		})

		socket.on('errorEvent', (err: GameError) => {
			set({ error: err })
		})

		socket.on('playerUpdated', (players: Player[]) => {
			set({ players })
		})

		socket.on('leaderboardUpdated', (playerId: string, stats: PlayerStats) => {
			const newLeaderboard = get().leaderboard
			newLeaderboard.push({ playerId, stats })
			console.log(newLeaderboard)
			if (playerId === get().socket?.id) {
				const position = newLeaderboard.findIndex(e => e.playerId === playerId)
				set({ leaderboard: newLeaderboard, position: position })
			} else {
				set({ leaderboard: newLeaderboard })
			}
		})

		socket.on('gameFinished', () => {
			set({ displayFinishModal: true, isGameStarted: false })
		})

		socket.on('caretUpdated', (payload: { playerId: string; caret: Caret }) => {
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
		})

		socket.on('disconnect', () => {
			set({
				connected: false,
				roomId: null,
				players: [],
				config: null,
				error: { type: '', message: '' },
				socket: null,
			})
		})

		socket.on('gameStarted', () => {
			set({ renderStartModal: true, leaderboard: [] })
		})

		socket.on('gameStopped', () => {
			set({ isGameStarted: false })
			set({
				waveRushGameResult: {
					byPlayer: {},
					byRound: {},
					currentRound: 0,
				},
			})
			get().resetPlayersCaret()
		})

		socket.on('configChanged', config => {
			set({ config: config })
		})

		socket.on('playerFinishedRound', (results: WaveRushRoundResultType) => {
			get().addRoundResult(results)
		})
	},

	createRoom: (playerName: string) => {
		get().socket?.emit('createRoom', { playerName: playerName })
	},

	setSelectedDuration: (duration: number) => {
		set({ selectedDuration: duration })
	},

	joinRoom: (roomId: string, playerName: string) => {
		get().socket?.emit('joinRoom', { roomId, playerName })
	},

	startGame: (roomId: string | null) => {
		if (!roomId) return
		get().socket?.emit('startGame', { roomId })
	},

	stopGame: (roomId: string | null) => {
		if (!roomId) return
		get().socket?.emit('stopGame', { roomId })
	},

	setIsGameStarted: (isGameStarted: boolean) => {
		set({ isGameStarted: isGameStarted })
	},

	setRenderStartModal: (renderStartModal: boolean) => {
		set({ renderStartModal: renderStartModal })
	},

	updateCaret: (caret: Caret, roomId: string) => {
		const socket = get().socket
		if (!socket) return

		set(state => ({
			players: state.players.map(p =>
				p.id === socket.id ? { ...p, progress: { caret } } : p
			),
		}))

		socket.emit('updateCaret', {
			caretIdx: caret.caretIdx,
			wordIdx: caret.wordIdx,
			roomId,
		})
	},

	handleConfigChange: (config: GameConfig, roomId: string | null) => {
		const socket = get().socket
		if (!socket || !config || !config.mode || !roomId) {
			return
		}
		socket.emit('configChange', { config, roomId })
	},

	handlePlayerFinish: (roomId: string | null, stats: PlayerStats) => {
		const socket = get().socket
		if (!socket || !roomId) return

		socket.emit('playerFinished', {
			roomId,
			stats,
		})
	},

	setDisplayFinishModal: (displayFinishModal: boolean) => {
		set({ displayFinishModal: displayFinishModal })
	},

	playerFinishRound: (
		roomId: string | null,
		results: WaveRushRoundResultType,
		currentRound: number
	) => {
		const socket = get().socket
		if (!socket || !roomId) return
		socket.emit('playerFinishRound', {
			roomId,
			results,
			currentRound,
		})
	},

	getCurrentRoundResult: () => {
		if (!get().socket) return null
		const results =
			get().waveRushGameResult.byRound[get().waveRushGameResult.currentRound] ||
			[]
		return results.find(r => r.playerId === get().socket?.id) || null
	},

	addRoundResult: (result: WaveRushRoundResultType) => {
		set(state => {
			const game = state.waveRushGameResult
			const round = game.currentRound

			const existingInRound = game.byRound[round]?.find(
				r => r.playerId === result.playerId
			)

			if (existingInRound) {
				return state
			}

			return {
				waveRushGameResult: {
					...game,
					byPlayer: {
						...game.byPlayer,
						[result.playerId]: [
							...(game.byPlayer[result.playerId] || []),
							result,
						],
					},
					byRound: {
						...game.byRound,
						[round]: [...(game.byRound[round] || []), result],
					},
				},
			}
		})
	},

	toNextWaveRushRound: () => {
		set(state => ({
			waveRushGameResult: {
				...state.waveRushGameResult,
				currentRound: state.waveRushGameResult.currentRound + 1,
			},
		}))
	},

	setWaveRushGameResult: (waveRushGameResult: WaveRushGameResult) => {
		set({ waveRushGameResult: waveRushGameResult })
	},

	resetPlayersCaret: () => {
		set(state => ({
			players: state.players.map(player => ({
				...player,
				progress: {
					...player.progress,
					caret: {
						caretIdx: -1,
						wordIdx: 0,
					},
				},
			})),
		}))
	},
}))
