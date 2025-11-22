import { useState, useCallback } from 'react'
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

	console.log(currentWords)

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

	const handleRoundComplete = useCallback(
		(result: WaveRushRoundResultType) => {
			addRoundResult(result)
			setIsRoundComplete(true)
		},
		[addRoundResult]
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
		// removePlayer,
		resetGame,
	}
}
