import { Button } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import Caret from './Caret.tsx'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import {
	PlayerColor,
	type GameDuration,
	type SingleplayerResultType,
} from '../common/types.ts'
import { TbReload } from 'react-icons/tb'
import GameFinishModalSingle from './GameFinishModalSingle.tsx'
import CountdownProgress from './CountdownProgress.tsx'
import useTypingStats from '../hooks/useTypingStats.ts'
import useGameTimer from '../hooks/useGameTimer.ts'
import useTypingLogic, { buildWordResult } from '../hooks/useTypingLogic.ts'
import useCaretAnimation from '../hooks/useCaretAnimation.ts'
import TypingArea from './TypingArea.tsx'

gsap.registerPlugin(Flip)

interface PracticeGameContainerProps {
	words: string[]
	duration: GameDuration
}

const PracticeGameContainer = ({
	words,
	duration,
}: PracticeGameContainerProps) => {
	const [results, setResults] = useState<null | SingleplayerResultType>(null)

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
		setResults(null)
	}, [resetTimer, resetTypingState])

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
			setResults(stats)
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
			setResults(stats)
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
		setResults(null)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [duration])

	const { containerRef, caretRef } = useCaretAnimation({
		caretIdx,
		currentWordIdx,
		isMultiplayer: false,
		socket: null,
		players: null,
	})

	return (
		<div>
			{duration !== 0 && (
				<CountdownProgress duration={duration} timeElapsed={timeElapsed} />
			)}

			{duration === 0 && (
				<div className='mb-[10px] text-4xl font-bold text-accent-primary'>
					{timeElapsed}
				</div>
			)}

			<div
				ref={containerRef}
				tabIndex={0}
				className='text-gray-500 max-w-[1200px] min-w-[400px] flex flex-wrap gap-2 text-2xl sm:text-3xl sm:gap-4 relative overscroll-none'
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

			{results && (
				<GameFinishModalSingle
					onCancel={resetGameState}
					footer={[
						<Button key='close' onClick={resetGameState}>
							Close
						</Button>,
					]}
					title='Your Results'
					isMultiplayer={false}
					results={results}
				/>
			)}

			<TbReload
				className='size-8 cursor-pointer mt-[50px] mx-auto text-gray-400'
				onClick={resetGameState}
			/>
		</div>
	)
}

export default PracticeGameContainer
