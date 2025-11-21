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
import useTypingLogic from '../hooks/useTypingLogic.ts'
import useCaretAnimation from '../hooks/useCaretAnimation.ts'

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
			const stats = calculateStats()
			setResults(stats)
			stopTimer()
		}
	}, [calculateStats, timeElapsed, duration, timerRef, resetTimer, stopTimer])

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
		}
	}, [
		currentWordIdx,
		caretIdx,
		words,
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

				{localWords?.map((word, wordIdx) => (
					<span key={wordIdx}>
						{word === currentWord && (
							<input
								className='text-3xl opacity-0 absolute flex focus:outline-none focus:ring-0 focus:border-transparent'
								autoFocus
								type='text'
								value={typed}
								onKeyDown={e => {
									onKeyDownPracticeMode(e)
									if (!startTime) {
										setStartTime(Date.now())
									}
								}}
							/>
						)}
						{word?.split('').map((char, charIdx) => {
							const state = getCharStyle(wordIdx, charIdx, char)
							return (
								<span
									key={charIdx}
									className={state}
									data-word={wordIdx}
									data-char={charIdx}
								>
									{char}
								</span>
							)
						})}
					</span>
				))}
			</div>

			{results && (
				<GameFinishModalSingle
					open={!!results}
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
