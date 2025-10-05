import { Button, Modal } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'
import Caret from './Caret.tsx'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import type { MainGameContainerProps } from '../common/types.ts'
gsap.registerPlugin(Flip)

const GAME_DURATION = [15, 30, 60]

const MainGameContainer = ({ words, mode }: MainGameContainerProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const caretRefs = useRef<(HTMLSpanElement | null)[]>([])
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	const { updateCaret, roomId, players, socket } = useGameStore()

	const [localWords, setLocalWords] = useState<string[]>(words)
	const [currentWordIdx, setCurrentWordIdx] = useState(0)
	const [currentWord, setCurrentWord] = useState<string | null>(
		localWords[currentWordIdx]
	)
	const [typed, setTyped] = useState<string>('')
	const [caretIdx, setCaretIdx] = useState(-1)
	const [wordResults, setWordResults] = useState<Record<number, string[]>>({})

	const [results, setResults] = useState<null | {
		accuracy: number
		wpm: number
		rawWpm: number
		correct: number
		incorrect: number
	}>(null)

	const [selectedDuration, setSelectedDuration] = useState<number>(
		GAME_DURATION[0]
	)
	const [startTime, setStartTime] = useState<number | null>(null)
	const [remainingTime, setRemainingTime] = useState<number>(selectedDuration)

	const getPlayerColor = (playerIndex: number) => {
		const colors = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b']
		return colors[playerIndex] || '#6b7280'
	}

	const calculateStats = () => {
		let correct = 0
		let incorrect = 0

		Object.values(wordResults).forEach(results => {
			results.forEach(r => {
				if (r === 'correct') correct++
				if (r === 'incorrect') incorrect++
			})
		})

		const totalTyped = correct + incorrect
		const accuracy = totalTyped > 0 ? (correct / totalTyped) * 100 : 0
		const timeInMinutes = selectedDuration / 60
		const wpm = correct / 5 / timeInMinutes
		const rawWpm = totalTyped / 5 / timeInMinutes

		return { accuracy, wpm, rawWpm, correct, incorrect }
	}

	const handleSpacePress = () => {
		if (typed.trim() === '') return
		setCaretIdx(-1)

		const currentResults = words[currentWordIdx].split('').map((char, idx) => {
			if (idx < typed.length) {
				return typed[idx] === char ? 'correct' : 'incorrect'
			}
			return 'untyped'
		})

		if (typed.length > words[currentWordIdx].length) {
			const overflowCount = typed.length - words[currentWordIdx].length
			for (let i = 0; i < overflowCount; i++) {
				currentResults.push('incorrect')
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

	const handleReset = () => {
		setCurrentWordIdx(0)
		setTyped('')
		setCurrentWord(words[0] ?? null)
		setWordResults({})
		setCaretIdx(-1)
		setLocalWords(words)
		if (roomId) {
			updateCaret({ caretIdx: -1, wordIdx: 0 }, roomId)
		}
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
		setRemainingTime(selectedDuration)
		setStartTime(null)
	}

	useEffect(() => {
		caretRefs.current = Array.from({ length: 4 }, () => null)
	}, [])

	useEffect(() => {
		if (!startTime) return

		timerRef.current = setInterval(() => {
			setRemainingTime(prev => prev - 1)
		}, 1000)

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [startTime])

	useEffect(() => {
		if (remainingTime === 0) {
			const stats = calculateStats()
			setResults(stats)
			handleReset()
		}
	}, [remainingTime])

	useEffect(() => {
		if (!roomId) return
		if (caretIdx !== -1 || currentWordIdx !== 0) {
			updateCaret({ caretIdx, wordIdx: currentWordIdx }, roomId)
		}
	}, [caretIdx, currentWordIdx, roomId, updateCaret])

	// Animate opponent carets
	useEffect(() => {
		if (!socket) return

		const otherPlayers = players.filter(p => p.id !== socket.id)

		otherPlayers.forEach((player, playerIndex) => {
			const caretElement = caretRefs.current[playerIndex]
			if (!caretElement) return

			const caret = player.progress?.caret
			if (!caret) return

			const { caretIdx: playerCaretIdx, wordIdx: playerWordIdx } = caret
			let target: HTMLElement | null = null

			if (playerCaretIdx === -1) {
				target = containerRef.current?.querySelector(
					`[data-word="${playerWordIdx}"][data-char="0"]`
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
				`[data-word="${playerWordIdx}"][data-char="${playerCaretIdx}"]`
			) as HTMLElement | null

			if (!target) return

			const state = Flip.getState(caretElement)
			target.appendChild(caretElement)
			Flip.from(state, {
				duration: 0.4,
				ease: 'power1.inOut',
			})
		})
	}, [players, socket])

	// Animate own caret
	useEffect(() => {
		const caretElement = caretRefs.current[3]
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

	const otherPlayers = socket ? players.filter(p => p.id !== socket.id) : []

	return (
		<div>
			<p>Current id: {currentWordIdx}</p>
			<p>Current word: {currentWord}</p>
			<p>Typed: {typed}</p>
			<p>Typed length: {typed?.length}</p>
			<p>
				Caret index: {caretIdx} Word index: {currentWordIdx}
			</p>
			<p>Players: {players.length}/4</p>

			<div className='mb-4'>
				{otherPlayers.map((player, index) => {
					const caret = player.progress?.caret
					return (
						<div key={player.id} className='text-sm'>
							<span style={{ color: getPlayerColor(index) }}>
								{player.playerName}
							</span>
							: Word {caret?.wordIdx ?? 0}, Position {caret?.caretIdx ?? -1}
						</div>
					)
				})}
			</div>

			<Button onClick={handleReset}>Reset</Button>
			<div>
				Duration:{' '}
				{GAME_DURATION &&
					GAME_DURATION.map((duration, idx) => {
						return (
							<span
								onClick={() => setSelectedDuration(duration)}
								key={idx}
								className={`${duration === selectedDuration ? 'font-bold text-yellow' : ''} mr-2 cursor-pointer`}
							>
								{duration}
							</span>
						)
					})}
			</div>
			<div>Elapsed time: {remainingTime}</div>
			<div
				ref={containerRef}
				tabIndex={0}
				className='h-[400px] text-gray-500 w-[900px] border border-black p-10 flex flex-wrap relative'
			>
				{localWords?.map((word, wordIdx) => (
					<span
						className={`mr-2 text-3xl ${currentWord === word ? 'text-black' : ''}`}
						key={wordIdx}
					>
						{word === currentWord && (
							<input
								className='text-3xl opacity-0 absolute flex focus:outline-none focus:ring-0 focus:border-transparent'
								autoFocus
								type='text'
								value={typed}
								onKeyDown={e => {
									if (e.key === ' ') {
										e.preventDefault()
										handleSpacePress()
										return
									}
									if (
										e.key === 'Tab' ||
										e.key === 'Enter' ||
										[
											'ArrowUp',
											'ArrowDown',
											'ArrowLeft',
											'ArrowRight',
										].includes(e.key)
									) {
										e.preventDefault()
										return
									}
									if (e.key === 'Backspace') {
										if (typed.length > 0) {
											if (caretIdx === typed.length - 1) {
												setCaretIdx(prev => Math.max(-1, prev - 1))
											}
										}
										return
									}
									if (mode === 'multiplayer') {
										const nextChar = localWords[currentWordIdx]?.[caretIdx + 1]
										if (nextChar && nextChar === e.key) {
											setCaretIdx(prev => prev + 1)
										} //allow to next char only typed correctly
									} else {
										setCaretIdx(prev => prev + 1)
									}
									if (!startTime) {
										setStartTime(Date.now())
									}
								}}
								onChange={e => {
									const value = e.target.value.replace(/ /g, '')
									setTyped(value)

									if (
										value.length > words[currentWordIdx].length &&
										value.length > localWords[currentWordIdx].length
									) {
										setLocalWords(prev => {
											const newLocalWords = [...prev]
											newLocalWords[currentWordIdx] = value
											return newLocalWords
										})
										setCurrentWord(value)
									}
								}}
							/>
						)}
						{word?.split('').map((char, idx) => {
							let state = ''
							if (wordIdx < currentWordIdx) {
								const storedResults = wordResults[wordIdx]
								if (storedResults && storedResults[idx]) {
									state =
										storedResults[idx] === 'correct'
											? 'text-white'
											: storedResults[idx] === 'incorrect'
												? 'text-red-500'
												: ''
								}
							} else if (wordIdx === currentWordIdx) {
								if (idx < typed.length) {
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
			</div>
			<Modal
				open={!!results}
				onCancel={() => setResults(null)}
				footer={[
					<Button key='close' onClick={() => setResults(null)}>
						Close
					</Button>,
				]}
				title='Your Results'
			>
				{results && (
					<div>
						<p>Accuracy: {results.accuracy.toFixed(1)}%</p>
						<p>WPM: {results.wpm.toFixed(1)}</p>
						<p>Raw WPM: {results.rawWpm.toFixed(1)}</p>
						<p>Correct chars: {results.correct}</p>
						<p>Incorrect chars: {results.incorrect}</p>
					</div>
				)}
			</Modal>
		</div>
	)
}

export default MainGameContainer
