import { Button } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import Caret from './Caret.tsx'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import {
	InputKey,
	CharacterState,
	PlayerColor,
	type GameDuration,
	type SingleplayerResultType,
} from '../common/types.ts'
import { TbReload } from 'react-icons/tb'
import { MAX_OVERFLOW } from '../common/constant.ts'
import GameFinishModalSingle from './GameFinishModalSingle.tsx'
import CountdownProgress from './CountdownProgress.tsx'

gsap.registerPlugin(Flip)

interface PracticeGameContainerProps {
	words: string[]
	duration: GameDuration
}

const PracticeGameContainer = ({
	words,
	duration,
}: PracticeGameContainerProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const caretRef = useRef<HTMLSpanElement | null>(null)
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const [localWords, setLocalWords] = useState<string[]>(words)
	const [currentWordIdx, setCurrentWordIdx] = useState(0)
	const [currentWord, setCurrentWord] = useState<string | null>(
		localWords[currentWordIdx]
	)
	const [typed, setTyped] = useState<string>('')
	const [caretIdx, setCaretIdx] = useState(-1)
	const [wordResults, setWordResults] = useState<Record<number, string[]>>({})
	const [results, setResults] = useState<null | SingleplayerResultType>(null)
	const [startTime, setStartTime] = useState<number | null>(null)
	const [timeElapsed, setTimeElapsed] = useState<number>(0)

	const calculateStats = useCallback(() => {
		let correct = 0
		let incorrect = 0

		Object.values(wordResults).forEach(results => {
			results.forEach(r => {
				if (r === CharacterState.CORRECT) correct++
				if (r === CharacterState.INCORRECT) incorrect++
			})
		})

		const totalTyped = correct + incorrect
		const accuracy = totalTyped > 0 ? (correct / totalTyped) * 100 : 0
		const timeInMinutes = timeElapsed / 60
		const wpm = correct / 5 / timeInMinutes
		const rawWpm = totalTyped / 5 / timeInMinutes

		return { accuracy, wpm, rawWpm, correct, incorrect }
	}, [wordResults, duration, timeElapsed])

	const handleSpacePress = () => {
		if (typed.trim() === '') return
		setCaretIdx(-1)

		const currentResults = words[currentWordIdx].split('').map((char, idx) => {
			if (idx < typed.length) {
				return typed[idx] === char
					? CharacterState.CORRECT
					: CharacterState.INCORRECT
			}
			return CharacterState.UNTYPED
		})

		if (typed.length > words[currentWordIdx].length) {
			const overflowCount = typed.length - words[currentWordIdx].length
			for (let i = 0; i < overflowCount; i++) {
				currentResults.push(CharacterState.INCORRECT)
			}
		}

		setWordResults(prev => ({
			...prev,
			[currentWordIdx]: currentResults,
		}))

		setCurrentWordIdx(prev => {
			const nextIdx = prev + 1
			setCurrentWord(localWords[nextIdx] ?? null)
			return nextIdx
		})
		setTyped('')
	}

	const handleReset = useCallback(() => {
		setCurrentWordIdx(0)
		setTyped('')
		setCurrentWord(words[0] ?? null)
		setWordResults({})
		setCaretIdx(-1)
		setLocalWords(words)
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
		setStartTime(null)
		setTimeElapsed(0)
		setResults(null)
	}, [words, duration])

	// Timer effect
	useEffect(() => {
		if (!startTime) return

		timerRef.current = setInterval(() => {
			if (duration !== 0) setTimeElapsed(prev => prev + 0.1)
			else setTimeElapsed(prev => prev + 0.1)
		}, 100)

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [duration, startTime])

	// Check if time is up
	useEffect(() => {
		if (duration !== 0 && timeElapsed >= duration && timerRef.current) {
			const stats = calculateStats()
			setResults(stats)
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [calculateStats, timeElapsed, duration])

	// Check if finished typing all words
	useEffect(() => {
		if (
			currentWordIdx === words.length - 1 &&
			caretIdx === words[currentWordIdx].length - 1
		) {
			const stats = calculateStats()
			setResults(stats)
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [currentWordIdx, caretIdx, words, calculateStats])

	// Animate caret
	useEffect(() => {
		const caretElement = caretRef.current
		if (!caretElement) return

		let target: HTMLElement | null = null
		if (caretIdx === -1) {
			target = containerRef.current?.querySelector(
				`[data-word="${currentWordIdx}"][data-char="0"]`
			) as HTMLElement | null

			if (target) {
				const state = Flip.getState(caretElement)
				target.parentNode?.insertBefore(caretElement, target)
				Flip.from(state, {
					duration: 0.4,
					ease: 'power1.inOut',
				})
			}
			return
		}

		target = containerRef.current?.querySelector(
			`[data-word="${currentWordIdx}"][data-char="${caretIdx}"]`
		) as HTMLElement | null

		if (!target) return

		const state = Flip.getState(caretElement)
		target.appendChild(caretElement)
		Flip.from(state, {
			duration: 0.15,
			ease: 'power1.inOut',
		})
	}, [currentWordIdx, caretIdx, localWords])

	// Initial caret positioning
	useEffect(() => {
		if (!containerRef.current) return

		requestAnimationFrame(() => {
			const caretElement = caretRef.current
			if (caretElement) {
				const target = containerRef.current?.querySelector(
					`[data-word="0"][data-char="0"]`
				) as HTMLElement | null

				if (target) {
					target.parentNode?.insertBefore(caretElement, target)
				}
			}
		})
	}, [])

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
									if (
										typed.length >
											words[currentWordIdx].length + MAX_OVERFLOW &&
										e.key !== InputKey.BACKSPACE
									)
										return

									if (e.key === InputKey.SPACE) {
										e.preventDefault()
										handleSpacePress()
										return
									}

									if (
										[
											InputKey.ENTER,
											InputKey.TAB,
											InputKey.ALT,
											InputKey.ARROW_UP,
											InputKey.ARROW_DOWN,
											InputKey.ARROW_LEFT,
											InputKey.ARROW_RIGHT,
										].includes(e.key)
									) {
										e.preventDefault()
										return
									}

									if (e.key === InputKey.BACKSPACE) {
										if (typed.length > 0) {
											const newLength = typed.length - 1
											setCaretIdx(prev => Math.max(-1, prev - 1))
											setTyped(prev => prev.slice(0, -1))

											if (newLength >= words[currentWordIdx].length) {
												const newWord = localWords[currentWordIdx].slice(
													0,
													newLength
												)
												setLocalWords(prev => {
													const newLocalWords = [...prev]
													newLocalWords[currentWordIdx] = newWord
													return newLocalWords
												})
												setCurrentWord(newWord)
												setTyped(newWord)
											}
										}
										return
									}

									if (!startTime) {
										setStartTime(Date.now())
									}

									if (typed.length >= words[currentWordIdx].length) {
										const newWord = localWords[currentWordIdx] + e.key
										setLocalWords(prev => {
											const newLocalWords = [...prev]
											newLocalWords[currentWordIdx] = newWord
											return newLocalWords
										})
										setCurrentWord(newWord)
									}

									setCaretIdx(prev => prev + 1)
									setTyped(prev => prev + e.key)
								}}
							/>
						)}
						{word?.split('').map((char, idx) => {
							let state = ''
							if (wordIdx < currentWordIdx) {
								const storedResults = wordResults[wordIdx]
								if (storedResults && storedResults[idx]) {
									state =
										storedResults[idx] === CharacterState.CORRECT
											? 'text-white'
											: storedResults[idx] === CharacterState.INCORRECT
												? 'text-red-500 underline'
												: ''
								}
							} else if (wordIdx === currentWordIdx) {
								if (idx >= words[currentWordIdx].length) {
									state = 'text-red-500'
								} else if (idx < typed.length) {
									state = typed[idx] === char ? 'text-white' : 'text-red-500'
								}
							}
							return (
								<span
									key={idx}
									className={state}
									data-word={wordIdx}
									data-char={idx}
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
					onCancel={handleReset}
					footer={[
						<Button key='close' onClick={handleReset}>
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
				onClick={handleReset}
			/>
		</div>
	)
}

export default PracticeGameContainer
