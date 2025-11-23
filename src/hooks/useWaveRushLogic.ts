import { useState, useCallback, useEffect } from 'react'
import type { WaveRushRoundResultType } from '../common/types.ts'
import { useGameStore } from '../stores/useGameStore.ts'

export const useWaveRushGame = (words: string[][]) => {
	const {
		waveRushGameResult: roundResults,
		playerFinishRound,
		roomId,
	} = useGameStore()
	const currentRound = roundResults.currentRound
	const currentWords = words[roundResults.currentRound]
	const isLastRound = roundResults.currentRound === words.length - 1

	const handleRoundComplete = useCallback(
		(result: WaveRushRoundResultType) => {
			// The `hasSubmittedResult` flag in useWaveRushRound prevents duplicates
			playerFinishRound(roomId, result)
		},
		[playerFinishRound, roomId]
	)

	return {
		roundResults,
		handleRoundComplete,
		isLastRound,
		currentWords,
		currentRound,
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
	resetTransitionTimer,
	resetGameState,
}: {
	mode: string
	waveRushMode?: {
		roundDuration: number
		onRoundComplete: (result: WaveRushRoundResultType) => void
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
	resetTransitionTimer: () => void
	resetGameState: () => void
}) => {
	const [hasSubmittedResult, setHasSubmittedResult] = useState(false)
	const [isFinishedEarly, setIsFinishedEarly] = useState(false)
	const { isTransitioning } = useGameStore()

	const submitRoundResult = useCallback(() => {
		if (!socket?.id || hasSubmittedResult) return

		const stats = calculateStats()
		waveRushMode?.onRoundComplete({
			...stats,
			playerId: socket.id,
			timeElapsed: gameTime,
		})
		setHasSubmittedResult(true)
	}, [socket?.id, hasSubmittedResult, calculateStats, waveRushMode, gameTime])

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
			setIsFinishedEarly(true)
			submitRoundResult()
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
			isTransitioning ||
			!gameTimerRef.current
		) {
			return
		}

		if (gameTime >= waveRushMode.roundDuration) {
			// Submit result if not already submitted
			if (!hasSubmittedResult) {
				submitRoundResult()
			}
			stopGameTimer()
			setIsFinishedEarly(false)
			//startTransitionTimer()
		}
	}, [
		mode,
		waveRushMode,
		gameTime,
		gameTimerRef,
		hasSubmittedResult,
		submitRoundResult,
		stopGameTimer,
		//startTransitionTimer,
		isTransitioning,
		socket?.id,
	])

	useEffect(() => {
		if (mode === 'wave-rush' && isTransitioning) {
			startTransitionTimer()
		}
	}, [mode, isTransitioning, startTransitionTimer])

	useEffect(() => {
		if (
			mode === 'wave-rush' &&
			!isTransitioning &&
			hasSubmittedResult &&
			!isFinishedEarly
		) {
			resetTransitionTimer()
			resetGameState()
			setHasSubmittedResult(false)
		}
	}, [
		hasSubmittedResult,
		isFinishedEarly,
		isTransitioning,
		mode,
		resetGameState,
		resetTransitionTimer,
	])

	return {
		hasSubmittedResult,
		isFinishedEarly,
	}
}
