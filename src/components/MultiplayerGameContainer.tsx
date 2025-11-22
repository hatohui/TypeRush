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
import RoundResultCard from './RoundResultCard.tsx'
import useTypingStats from '../hooks/useTypingStats.ts'
import useGameTimer from '../hooks/useGameTimer.ts'
import useTypingLogic from '../hooks/useTypingLogic.ts'
import useCaretAnimation from '../hooks/useCaretAnimation.ts'
import TypingArea from './TypingArea.tsx'

gsap.registerPlugin(Flip)

interface WaveRushModeProps {
	roundDuration: number
	onRoundComplete: (
		result: WaveRushRoundResultType,
		playerId?: string,
		isTimeUp?: boolean
	) => void
	timeBetweenRound: number
	isRoundComplete: boolean
	handleNextRound: () => void
	currentRoundResult?: WaveRushRoundResultType | null
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
	const [isCompleteEarly, setIsCompleteEarly] = useState(false)

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
		stopTimer: stopTransitionTimer,
	} = useGameTimer(false, 1000)

	const { calculateStats } = useTypingStats(wordResults, gameTime)

	const resetGameState = useCallback(() => {
		resetTypingState()
		resetGameTimer()
		setResults(null)
		resetPlayersCaret()
	}, [resetTypingState, resetGameTimer, resetPlayersCaret])

	// Check if round time is up (wave-rush mode)
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
	])

	// Check if finished typing all words early (wave-rush mode)
	useEffect(() => {
		if (
			currentWordIdx === words.length - 1 &&
			caretIdx === words[currentWordIdx].length - 1 &&
			gameTimerRef.current &&
			mode === 'wave-rush' &&
			waveRushMode &&
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
			{mode === 'wave-rush' &&
				waveRushMode &&
				!waveRushMode.isRoundComplete && (
					<CountdownProgress
						duration={waveRushMode.roundDuration}
						timeElapsed={gameTime}
					/>
				)}

			{mode === 'wave-rush' &&
				waveRushMode &&
				(waveRushMode.isRoundComplete || isCompleteEarly) && (
					<>
						<CountdownProgress
							duration={waveRushMode.timeBetweenRound}
							timeElapsed={transitionTime}
							isTransition={true}
						/>
						{isCompleteEarly && <div>Waiting for others...</div>}
						<RoundResultCard
							result={waveRushMode.currentRoundResult ?? null}
							roundNumber={waveRushMode.currentRound}
						/>
					</>
				)}

			<div
				ref={containerRef}
				tabIndex={0}
				className='text-gray-500 max-w-[1200px] min-w-[400px] flex flex-wrap gap-2 text-2xl sm:text-3xl sm:gap-4 relative overscroll-none transition-opacity duration-300'
				style={{
					opacity: waveRushMode?.isRoundComplete || isCompleteEarly ? 0 : 1,
					pointerEvents: waveRushMode?.isRoundComplete ? 'none' : 'auto',
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
					isRoundComplete={waveRushMode?.isRoundComplete}
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
