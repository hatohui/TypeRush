import { useState, useCallback, useEffect } from 'react'
import type {
	WaveRushGameResult,
	WaveRushRoundResultType,
} from '../common/types.ts'
import { useGameStore } from '../stores/useGameStore.ts'

const initialGameState: WaveRushGameResult = {
	byPlayer: {},
	byRound: {},
	currentRound: 0,
}

export const useWaveRushGame = (words: string[][]) => {
	const {
		waveRushGameResult: roundResults,
		setWaveRushGameResult: setRoundResults,
		addRoundResult,
		toNextWaveRushRound,
		playerFinishRound,
		roomId,
	} = useGameStore()
	const [isRoundComplete, setIsRoundComplete] = useState(false)
	const currentRound = roundResults.currentRound
	const currentWords = words[roundResults.currentRound]
	const isLastRound = roundResults.currentRound === words.length - 1

	const handleRoundComplete = useCallback(
		(result: WaveRushRoundResultType, isTimeUp: boolean = false) => {
			// The `hasSubmittedResult` flag in useWaveRushRound prevents duplicates
			playerFinishRound(roomId, result, currentRound)

			// Only trigger transition when time is up
			if (isTimeUp) {
				setIsRoundComplete(true)
			}
		},
		[currentRound, playerFinishRound, roomId]
	)

	const handleNextRound = useCallback(() => {
		toNextWaveRushRound()
		setIsRoundComplete(false)
	}, [toNextWaveRushRound])

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
		handleRoundComplete,
		handleNextRound,
		isLastRound,
		isRoundComplete,
		setIsRoundComplete,
		currentWords,
		currentRound,
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
			isTimeUp?: boolean
		) => void
		timeBetweenRound: number
		isRoundComplete: boolean
		handleNextRound: () => void
		setIsRoundComplete: (isRoundComplete: boolean) => void
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
	const [hasSubmittedResult, setHasSubmittedResult] = useState(false)

	const submitRoundResult = useCallback(
		(isTimeUp: boolean) => {
			if (!socket?.id || hasSubmittedResult) return

			const stats = calculateStats()
			waveRushMode?.onRoundComplete(
				{
					...stats,
					playerId: socket.id,
					timeElapsed: gameTime,
				},
				isTimeUp
			)
			setHasSubmittedResult(true)
		},
		[socket?.id, hasSubmittedResult, calculateStats, waveRushMode, gameTime]
	)

	// Check if finished typing all words early
	useEffect(() => {
		if (
			mode !== 'wave-rush' ||
			!waveRushMode ||
			hasSubmittedResult ||
			!gameTimerRef.current
		)
			return

		const isFinishedTyping =
			currentWordIdx === words.length - 1 &&
			caretIdx === words[currentWordIdx].length - 1

		if (isFinishedTyping) {
			submitRoundResult(false)
		}
	}, [
		mode,
		currentWordIdx,
		caretIdx,
		words,
		hasSubmittedResult,
		gameTimerRef,
		submitRoundResult,
		waveRushMode,
	])

	// Check if round time is up
	useEffect(() => {
		if (
			mode !== 'wave-rush' ||
			!waveRushMode ||
			waveRushMode.isRoundComplete ||
			!gameTimerRef.current
		) {
			return
		}

		if (gameTime >= waveRushMode.roundDuration) {
			// Submit result if not already submitted
			if (!hasSubmittedResult) {
				submitRoundResult(true)
			}

			stopGameTimer()
			startTransitionTimer()

			if (!waveRushMode.isRoundComplete) {
				waveRushMode.setIsRoundComplete(true)
			}
		}
	}, [
		mode,
		waveRushMode,
		gameTime,
		gameTimerRef,
		hasSubmittedResult,
		submitRoundResult,
		stopGameTimer,
		startTransitionTimer,
		waveRushMode?.isRoundComplete,
		socket?.id,
	])

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
			setHasSubmittedResult(false)
		}
	}, [
		mode,
		waveRushMode,
		transitionTime,
		stopTransitionTimer,
		resetTransitionTimer,
		resetGameState,
	])

	return {
		hasSubmittedResult,
	}
}
