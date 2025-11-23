import { Button } from 'antd'
import { useCallback, useEffect, useState } from 'react'
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
import { useWaveRushRound } from '../hooks/useWaveRushLogic.ts'
import TypingArea from './TypingArea.tsx'

gsap.registerPlugin(Flip)

interface WaveRushModeProps {
	roundDuration: number
	onRoundComplete: (result: WaveRushRoundResultType, isTimeUp?: boolean) => void
	currentRound: number
}

interface MultiplayerGameContainerProps {
	words: string[]
	mode: MultiplayerMode
	waveRushMode?: WaveRushModeProps
}

const MultiplayerGameContainer = ({
	words,
	mode,
	waveRushMode,
}: MultiplayerGameContainerProps) => {
	const {
		updateCaret,
		roomId,
		players,
		socket,
		handlePlayerFinish,
		position,
		resetPlayersCaret,
		isTransitioning,
		config,
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

	// Game timer - tracks typing progress (100ms precision)
	const {
		timeElapsed: gameTime,
		resetTimer: resetGameTimer,
		timerRef: gameTimerRef,
		stopTimer: stopGameTimer,
	} = useGameTimer(true, 100)

	// Transition timer - tracks between-round countdown (1s intervals for smooth UI)
	const {
		timeElapsed: transitionTime,
		resetTimer: resetTransitionTimer,
		startTimer: startTransitionTimer,
	} = useGameTimer(false, 1000)

	const { calculateStats } = useTypingStats(wordResults, gameTime)

	const resetGameState = useCallback(() => {
		resetTypingState()
		resetGameTimer()
		setResults(null)
		resetPlayersCaret()
	}, [resetTypingState, resetGameTimer, resetPlayersCaret])

	// Wave Rush round management hook
	const { hasSubmittedResult } = useWaveRushRound({
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
	})

	// Check if finished typing all words (type-race mode)
	useEffect(() => {
		if (
			currentWordIdx === words.length - 1 &&
			caretIdx === words[currentWordIdx].length - 1 &&
			gameTimerRef.current &&
			mode === 'type-race'
		) {
			const stats = calculateStats()
			setResults(stats)
			stopGameTimer()
			handlePlayerFinish(roomId, stats)
		}
	}, [
		currentWordIdx,
		caretIdx,
		words,
		calculateStats,
		handlePlayerFinish,
		roomId,
		gameTimerRef,
		stopGameTimer,
		mode,
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
			{mode === 'wave-rush' && waveRushMode && !isTransitioning && (
				<CountdownProgress
					duration={waveRushMode.roundDuration}
					timeElapsed={gameTime}
				/>
			)}

			{mode === 'wave-rush' && isTransitioning && (
				<>
					<CountdownProgress
						duration={
							config?.mode === mode && mode === 'wave-rush'
								? config.timeBetweenRounds
								: 3
						}
						timeElapsed={transitionTime}
						isTransition={true}
					/>
				</>
			)}

			{mode === 'wave-rush' && hasSubmittedResult && !isTransitioning && (
				<div className='text-center text-green-400 text-lg font-semibold mb-4 animate-pulse'>
					✓ Round Complete! Waiting for others...
				</div>
			)}

			<div
				ref={containerRef}
				tabIndex={0}
				className='text-gray-500 max-w-[1200px] min-w-[400px] flex flex-wrap relative overscroll-none transition-opacity duration-300'
				style={{
					opacity: isTransitioning || hasSubmittedResult ? 0.4 : 1,
					pointerEvents:
						isTransitioning || hasSubmittedResult ? 'none' : 'auto',
				}}
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
					isRoundComplete={isTransitioning || hasSubmittedResult}
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
