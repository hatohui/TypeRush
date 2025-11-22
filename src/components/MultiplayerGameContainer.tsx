import { Button } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'
import Caret from './Caret.tsx'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import {
	type MultiplayerMode,
	PlayerColor,
	type SingleplayerResultType,
	type WaveRushRoundResultType,
} from '../common/types.ts'
import GameFinishModalSingle from './GameFinishModalSingle.tsx'
import CountdownProgress from './CountdownProgress.tsx'
import useTypingStats from '../hooks/useTypingStats.ts'
import useGameTimer from '../hooks/useGameTimer.ts'
import useTypingLogic from '../hooks/useTypingLogic.ts'
import useCaretAnimation from '../hooks/useCaretAnimation.ts'
import TypingArea from './TypingArea.tsx'

gsap.registerPlugin(Flip)

interface MultiplayerGameContainerProps {
	words: string[]
	mode: MultiplayerMode
	roundDuration?: number
	onRoundComplete?: (result: WaveRushRoundResultType) => void
	timeBetweenRound?: number
	isRoundComplete?: boolean
	setIsRoundComplete?: (
		value: React.Dispatch<React.SetStateAction<boolean>>
	) => void
	handleNextRound?: () => void
}

const MultiplayerGameContainer = ({
	words,
	mode,
	roundDuration,
	onRoundComplete,
	timeBetweenRound = 3,
	isRoundComplete,
	handleNextRound,
}: MultiplayerGameContainerProps) => {
	const {
		updateCaret,
		roomId,
		players,
		socket,
		handlePlayerFinish,
		position,
		resetPlayersCaret,
	} = useGameStore()

	const {
		currentWordIdx,
		currentWord,
		typed,
		caretIdx,
		wordResults,
		localWords,
		resetTypingState,
		getCharStyle,
		onKeyDownMultiplayer,
	} = useTypingLogic(words)
	const [results, setResults] = useState<null | SingleplayerResultType>(null)

	const getPlayerColor = (playerIndex: number) => {
		const colors = [
			PlayerColor.RED,
			PlayerColor.GREEN,
			PlayerColor.AMBER,
			PlayerColor.BLUE,
		]
		return colors[playerIndex] || PlayerColor.GRAY
	}

	const { timeElapsed, resetTimer, timerRef, stopTimer, startTimer } =
		useGameTimer(true)
	const { calculateStats } = useTypingStats(wordResults, timeElapsed)

	const resetGameState = useCallback(() => {
		resetTypingState()
		resetTimer()
		setResults(null)
		resetPlayersCaret()
	}, [resetTypingState, resetTimer, resetPlayersCaret])

	// Check if time is up (wave-rush mode)
	useEffect(() => {
		if (
			roundDuration &&
			roundDuration !== 0 &&
			timeElapsed >= roundDuration &&
			timerRef.current &&
			mode === 'wave-rush' &&
			onRoundComplete &&
			socket &&
			socket.id
		) {
			const stats = calculateStats()
			const id = socket.id
			onRoundComplete({
				...stats,
				playerId: id,
				timeElapsed,
			})
			resetTimer()
			startTimer()
		}
	}, [
		calculateStats,
		timeElapsed,
		roundDuration,
		timerRef,
		stopTimer,
		mode,
		onRoundComplete,
		socket,
		resetTimer,
		startTimer,
	])

	useEffect(() => {
		if (timeElapsed >= 3 && isRoundComplete === true && handleNextRound) {
			handleNextRound()
			resetTimer()
			startTimer()
		}
	}, [handleNextRound, isRoundComplete, resetTimer, startTimer, timeElapsed])

	// Check if finished typing all words
	useEffect(() => {
		if (
			currentWordIdx === words.length - 1 &&
			caretIdx === words[currentWordIdx].length - 1 &&
			timerRef.current
		) {
			const stats = calculateStats()
			setResults(stats)
			stopTimer()
			handlePlayerFinish(roomId, stats)
		}
	}, [
		currentWordIdx,
		caretIdx,
		words,
		calculateStats,
		handlePlayerFinish,
		roomId,
		timerRef,
		stopTimer,
	])

	// Update caret position to server
	useEffect(() => {
		if (!roomId) return
		if (caretIdx !== -1 || currentWordIdx !== 0) {
			updateCaret({ caretIdx, wordIdx: currentWordIdx }, roomId)
		}
	}, [caretIdx, currentWordIdx, roomId, updateCaret])

	const { containerRef, caretRefs } = useCaretAnimation({
		caretIdx,
		currentWordIdx,
		isMultiplayer: true,
		socket: socket,
		players: players,
	})

	const otherPlayers = socket ? players.filter(p => p.id !== socket.id) : []

	return (
		<div>
			{mode === 'wave-rush' && roundDuration && !isRoundComplete && (
				<CountdownProgress duration={roundDuration} timeElapsed={timeElapsed} />
			)}

			{mode === 'wave-rush' && timeBetweenRound && isRoundComplete && (
				<CountdownProgress
					duration={timeBetweenRound}
					timeElapsed={timeElapsed}
				/>
			)}

			<div
				ref={containerRef}
				tabIndex={0}
				className='text-gray-500 max-w-[1200px] min-w-[400px] flex flex-wrap gap-2 text-2xl sm:text-3xl sm:gap-4 relative overscroll-none'
			>
				<Caret
					ref={el => {
						caretRefs.current[3] = el
					}}
					color={getPlayerColor(3)}
				/>
				{otherPlayers.map((player, playerIndex) => (
					<Caret
						key={player.id}
						ref={el => {
							caretRefs.current[playerIndex] = el
						}}
						isOpponent
						playerName={player.playerName}
						color={getPlayerColor(playerIndex)}
					/>
				))}
				<TypingArea
					localWords={localWords}
					currentWord={currentWord}
					typed={typed}
					onKeyDown={onKeyDownMultiplayer}
					getCharStyle={getCharStyle}
				/>
			</div>

			{results && (
				<GameFinishModalSingle
					open={position != null}
					onCancel={resetGameState}
					footer={[
						<Button key='close' onClick={resetGameState}>
							Close
						</Button>,
					]}
					title='Your Results'
					isMultiplayer={true}
					results={results}
					position={position}
				/>
			)}
		</div>
	)
}

export default MultiplayerGameContainer
