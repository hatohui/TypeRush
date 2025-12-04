import { useCallback, useEffect, useState } from 'react'
import Caret from './Caret.tsx'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import {
	PlayerColor,
	type GameDuration,
	type PlayerStats,
} from '../common/types.ts'
import { TbReload } from 'react-icons/tb'
import CountdownProgress from './CountdownProgress.tsx'
import useTypingStats from '../hooks/useTypingStats.ts'
import useGameTimer from '../hooks/useGameTimer.ts'
import useTypingLogic, { buildWordResult } from '../hooks/useTypingLogic.ts'
import useCaretAnimation from '../hooks/useCaretAnimation.ts'
import TypingArea from './TypingArea.tsx'
import { useGameStore } from '../stores/useGameStore.ts'
import GameFinishResultsWGraph from './GameFinishResultsWGraph.tsx'

gsap.registerPlugin(Flip)

interface PracticeGameContainerProps {
	words: string[]
	duration: GameDuration
}

const PracticeGameContainer = ({
	words,
	duration,
}: PracticeGameContainerProps) => {
	const [playerStats, setPlayerStats] = useState<null | PlayerStats>(null)
	const { setShouldHideUI } = useGameStore()
	const [shouldDisplayResults, setShouldDisplayResults] = useState(false)

	const {
		timeElapsed,
		startTime,
		setStartTime,
		resetTimer,
		stopTimer,
		timerRef,
	} = useGameTimer(false)
	const {
		currentWordIdx,
		currentWord,
		typed,
		caretIdx,
		wordResults,
		resetTypingState,
		localWords,
		onKeyDownPracticeMode,
		getCharStyle,
	} = useTypingLogic(words)
	const { calculateStats } = useTypingStats(wordResults, timeElapsed)

	const resetGameState = useCallback(() => {
		resetTypingState()
		resetTimer()
		setPlayerStats(null)
		setShouldDisplayResults(false)
	}, [resetTimer, resetTypingState])

	useEffect(() => {
		if (startTime) {
			setShouldHideUI(true)
		} else {
			setShouldHideUI(false)
		}
	}, [startTime, setShouldHideUI])

	// Check if time is up
	useEffect(() => {
		if (duration !== 0 && timeElapsed >= duration && timerRef.current) {
			// Build final word result synchronously to include in stats
			const finalWordResult = buildWordResult(words[currentWordIdx], typed)

			// Create complete wordResults with final word
			const completeWordResults = {
				...wordResults,
				[currentWordIdx]: finalWordResult,
			}

			const stats = calculateStats(completeWordResults)
			setPlayerStats(stats)
			stopTimer()
		}
	}, [
		calculateStats,
		currentWordIdx,
		duration,
		stopTimer,
		timeElapsed,
		timerRef,
		typed,
		wordResults,
		words,
	])

	// Check if finished typing all words
	useEffect(() => {
		if (
			currentWordIdx === words.length - 1 &&
			caretIdx === words[currentWordIdx].length - 1 &&
			timerRef.current
		) {
			// Build final word result synchronously to include in stats
			const finalWordResult = buildWordResult(words[currentWordIdx], typed)

			// Create complete wordResults with final word
			const completeWordResults = {
				...wordResults,
				[currentWordIdx]: finalWordResult,
			}

			// Calculate stats with complete data
			const stats = calculateStats(completeWordResults)
			setPlayerStats(stats)
			stopTimer()
		}
	}, [
		currentWordIdx,
		caretIdx,
		words,
		typed,
		wordResults,
		calculateStats,
		resetTimer,
		stopTimer,
		timerRef,
	])

	//Reset game when duration changes
	useEffect(() => {
		resetTypingState()
		resetTimer()
		setPlayerStats(null)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [duration])

	const { containerRef, caretRef } = useCaretAnimation({
		caretIdx,
		currentWordIdx,
		isMultiplayer: false,
		socket: null,
		players: null,
	})

	useEffect(() => {
		if (playerStats && timeElapsed && startTime) {
			setShouldDisplayResults(true)
		} else setShouldDisplayResults(false)
	}, [playerStats, startTime, timeElapsed])

	return (
		<div className='flex flex-col'>
			{duration !== 0 && (
				<div
					className={`${shouldDisplayResults && 'opacity-0'} transition duration-200`}
				>
					<CountdownProgress duration={duration} timeElapsed={timeElapsed} />
				</div>
			)}

			{duration === 0 && (
				<div
					className={`mb-[10px] text-4xl font-bold text-accent-primary ${shouldDisplayResults && 'opacity-0'} transition duration-200`}
				>
					{timeElapsed}
				</div>
			)}

			<div
				ref={containerRef}
				tabIndex={0}
				className={`text-gray-500 max-w-[1200px] min-w-[400px] flex flex-wrap gap-2 text-2xl sm:text-3xl sm:gap-4 relative overscroll-none ${shouldDisplayResults && 'opacity-0'} transition duration-200`}
			>
				<Caret ref={caretRef} color={PlayerColor.BLUE} />

				<TypingArea
					localWords={localWords}
					currentWord={currentWord}
					typed={typed}
					onKeyDown={e => onKeyDownPracticeMode(e, startTime, setStartTime)}
					getCharStyle={getCharStyle}
				/>
			</div>

			<div
				className={`transition-opacity justify-center items-center duration-200 ${shouldDisplayResults ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
			>
				<GameFinishResultsWGraph
					stats={playerStats}
					wordResults={wordResults}
					testType={'custom'}
					startTime={startTime}
					duration={duration}
				/>
			</div>

			{!shouldDisplayResults && (
				<div className='w-full z-50 flex justify-center items-center'>
					<button className='mt-[50px] cursor-pointer' onClick={resetGameState}>
						<TbReload className='text-gray-400 size-12' />
					</button>
				</div>
			)}
		</div>
	)
}

export default PracticeGameContainer
