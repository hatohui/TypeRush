import { useState, useCallback, useEffect } from 'react'
import type {
	WaveRushGameResult,
	WaveRushRoundResultType,
} from '../common/types.ts'

const initialGameState: WaveRushGameResult = {
	byPlayer: {},
	byRound: {},
	currentRound: 0,
}

export const useWaveRushGame = (words: string[][]) => {
	const [roundResults, setRoundResults] =
		useState<WaveRushGameResult>(initialGameState)
	const [isRoundComplete, setIsRoundComplete] = useState(false)
	const currentRound = roundResults.currentRound
	const currentWords = words[roundResults.currentRound]
	const isLastRound = roundResults.currentRound === words.length - 1

	const addRoundResult = useCallback((result: WaveRushRoundResultType) => {
		setRoundResults(prev => ({
			...prev,
			byPlayer: {
				...prev.byPlayer,
				[result.playerId]: [...(prev.byPlayer[result.playerId] || []), result],
			},
			byRound: {
				...prev.byRound,
				[prev.currentRound]: [
					...(prev.byRound[prev.currentRound] || []),
					result,
				],
			},
		}))
	}, [])

	const getLeaderboard = useCallback(
		(roundNumber: number) => {
			const round = roundResults.byRound[roundNumber] || []

			return [...round].sort(
				(a, b) => b.correct - a.correct || a.timeElapsed - b.timeElapsed
			)
		},
		[roundResults.byRound]
	)

	const getCurrentRoundResult = useCallback(
		(playerId?: string) => {
			if (!playerId) return null
			const results = roundResults.byRound[currentRound] || []
			return results.find(r => r.playerId === playerId) || null
		},
		[roundResults.byRound, currentRound]
	)

	const handleRoundComplete = useCallback(
		(
			result: WaveRushRoundResultType,
			playerId?: string,
			isTimeUp: boolean = false
		) => {
			const alreadyHaveResult = getCurrentRoundResult(playerId)

			// Add result only if it's the first submission for this player
			if (!alreadyHaveResult) {
				addRoundResult(result)
			}

			// Set round complete only when time runs out (triggers transition)
			if (isTimeUp) {
				setIsRoundComplete(true)
			}
		},
		[addRoundResult, getCurrentRoundResult]
	)

	const handleNextRound = useCallback(() => {
		setRoundResults(prev => ({
			...prev,
			currentRound: prev.currentRound + 1,
		}))
		setIsRoundComplete(false)
	}, [])

	// const removePlayer = useCallback((socketId: string) => {
	// 	setRoundResults(prev => {
	// 		const { [socketId]: removed, ...restPlayers } = prev.byPlayer
	//
	// 		const newByRound: typeof prev.byRound = {}
	// 		for (const round in prev.byRound) {
	// 			newByRound[round] = prev.byRound[round].filter(
	// 				r => r.socketId !== socketId
	// 			)
	// 		}
	//
	// 		return {
	// 			...prev,
	// 			byPlayer: restPlayers,
	// 			byRound: newByRound,
	// 		}
	// 	})
	// }, [])

	const resetGame = useCallback(() => {
		setRoundResults(initialGameState)
	}, [])

	return {
		roundResults,
		addRoundResult,
		getLeaderboard,
		handleRoundComplete,
		handleNextRound,
		isLastRound,
		isRoundComplete,
		setIsRoundComplete,
		currentWords,
		currentRound,
		getCurrentRoundResult,
		// removePlayer,
		resetGame,
	}
}

// Hook for managing a single round's execution in Wave Rush mode
export const useWaveRushRound = ({
	mode,
	waveRushMode,
	words,
	currentWordIdx,
	caretIdx,
	socket,
	calculateStats,
	gameTime,
	gameTimerRef,
	stopGameTimer,
	startTransitionTimer,
	transitionTime,
	stopTransitionTimer,
	resetTransitionTimer,
	resetGameState,
}: {
	mode: string
	waveRushMode?: {
		roundDuration: number
		onRoundComplete: (
			result: WaveRushRoundResultType,
			playerId?: string,
			isTimeUp?: boolean
		) => void
		timeBetweenRound: number
		isRoundComplete: boolean
		handleNextRound: () => void
	}
	words: string[]
	currentWordIdx: number
	caretIdx: number
	socket: { id?: string } | null
	calculateStats: () => {
		accuracy: number
		wpm: number
		rawWpm: number
		correct: number
		incorrect: number
	}
	gameTime: number
	gameTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
	stopGameTimer: () => void
	startTransitionTimer: () => void
	transitionTime: number
	stopTransitionTimer: () => void
	resetTransitionTimer: () => void
	resetGameState: () => void
}) => {
	const [isCompleteEarly, setIsCompleteEarly] = useState(false)

	// Check if round time is up
	useEffect(() => {
		if (
			mode === 'wave-rush' &&
			waveRushMode &&
			!waveRushMode.isRoundComplete &&
			gameTime >= waveRushMode.roundDuration &&
			gameTimerRef.current &&
			socket?.id
		) {
			const stats = calculateStats()
			waveRushMode.onRoundComplete(
				{
					...stats,
					playerId: socket.id,
					timeElapsed: gameTime,
				},
				socket.id,
				true // isTimeUp = true
			)
			stopGameTimer()
			startTransitionTimer()
		}
	}, [
		mode,
		waveRushMode,
		gameTime,
		gameTimerRef,
		socket,
		calculateStats,
		stopGameTimer,
		startTransitionTimer,
	])

	// Check if transition countdown is complete
	// Add 0.5s buffer to ensure "Get Ready!" message shows at 0s before transitioning
	useEffect(() => {
		if (
			mode === 'wave-rush' &&
			waveRushMode?.isRoundComplete &&
			transitionTime >= waveRushMode.timeBetweenRound + 0.5
		) {
			waveRushMode.handleNextRound()
			stopTransitionTimer()
			resetTransitionTimer()
			resetGameState()
			setIsCompleteEarly(false)
		}
	}, [
		mode,
		waveRushMode,
		transitionTime,
		stopTransitionTimer,
		resetTransitionTimer,
		resetGameState,
	])

	// Check if finished typing all words early
	useEffect(() => {
		if (
			currentWordIdx === words.length - 1 &&
			caretIdx === words[currentWordIdx].length - 1 &&
			gameTimerRef.current &&
			mode === 'wave-rush' &&
			waveRushMode &&
			socket?.id &&
			!isCompleteEarly
		) {
			const stats = calculateStats()
			waveRushMode.onRoundComplete(
				{
					...stats,
					playerId: socket.id,
					timeElapsed: gameTime,
				},
				socket.id,
				false // isTimeUp = false (finished early)
			)
			setIsCompleteEarly(true)
		}
	}, [
		calculateStats,
		caretIdx,
		currentWordIdx,
		gameTime,
		gameTimerRef,
		mode,
		socket?.id,
		waveRushMode,
		words,
		isCompleteEarly,
	])

	return {
		isCompleteEarly,
	}
}
