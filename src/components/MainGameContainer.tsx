import { Button, Modal } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'
import Caret from './Caret.tsx'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import {
	InputKey,
	CharacterState,
	PlayerColor,
	TypingMode,
	type MainGameContainerProps,
} from '../common/types.ts'
import { TbReload } from 'react-icons/tb'
import { MAX_OVERFLOW } from '../common/constant.ts'
gsap.registerPlugin(Flip)

const MainGameContainer = ({
	words,
	mode,
	duration,
}: MainGameContainerProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const caretRefs = useRef<(HTMLSpanElement | null)[]>([])
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const { updateCaret, roomId, players, socket, handlePlayerFinish, position } =
		useGameStore()

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

	const [startTime, setStartTime] = useState<number | null>(null)
	const [remainingTime, setRemainingTime] = useState<number>(duration)
	const [timeElapsed, setTimeElapsed] = useState<number>(0)

	const getPlayerColor = (playerIndex: number) => {
		const colors = [
			PlayerColor.RED,
			PlayerColor.GREEN,
			PlayerColor.AMBER,
			PlayerColor.BLUE,
		]
		return colors[playerIndex] || PlayerColor.GRAY
	}

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
		const timeInMinutes = duration !== 0 ? duration / 60 : timeElapsed / 60
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
		if (roomId) {
			updateCaret({ caretIdx: -1, wordIdx: 0 }, roomId)
		}
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
		setRemainingTime(duration)
		setStartTime(null)
		setTimeElapsed(0)
		setResults(null)
	}, [words, roomId, updateCaret, duration])

	useEffect(() => {
		caretRefs.current = Array.from({ length: 4 }, () => null)
	}, [])

	useEffect(() => {
		if (!startTime) return

		timerRef.current = setInterval(() => {
			if (duration !== 0) setRemainingTime(prev => prev - 1)
			else setTimeElapsed(prev => prev + 1)
		}, 1000)

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [duration, startTime])

	useEffect(() => {
		setRemainingTime(duration)
	}, [duration])

	useEffect(() => {
		if (remainingTime === 0 && duration !== 0 && timerRef.current) {
			const stats = calculateStats()
			setResults(stats)
			if (timerRef.current) clearInterval(timerRef.current)
		}
	}, [calculateStats, handleReset, remainingTime, duration])

	useEffect(() => {
		if (
			currentWordIdx === words.length - 1 &&
			caretIdx === words[currentWordIdx].length - 1
		) {
			const stats = calculateStats()
			setResults(stats)
			if (timerRef.current) clearInterval(timerRef.current)
			handlePlayerFinish(roomId, stats)
		}
	}, [
		currentWordIdx,
		caretIdx,
		duration,
		words,
		calculateStats,
		handlePlayerFinish,
		roomId,
	])

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

	// Initial caret positioning for all players
	useEffect(() => {
		if (!containerRef.current) return

		requestAnimationFrame(() => {
			// Position own caret
			const ownCaretElement = caretRefs.current[3]
			if (ownCaretElement) {
				const target = containerRef.current?.querySelector(
					`[data-word="0"][data-char="0"]`
				) as HTMLElement | null

				if (target) {
					target.parentNode?.insertBefore(ownCaretElement, target)
				}
			}

			// Position other players' carets
			if (!socket) return
			const otherPlayers = players.filter(p => p.id !== socket.id)

			otherPlayers.forEach((player, playerIndex) => {
				const caretElement = caretRefs.current[playerIndex]
				if (!caretElement) return

				const caret = player.progress?.caret
				const wordIdx = caret?.wordIdx ?? 0
				const caretIdx = caret?.caretIdx ?? -1

				let target: HTMLElement | null = null

				if (caretIdx === -1) {
					target = containerRef.current?.querySelector(
						`[data-word="${wordIdx}"][data-char="0"]`
					) as HTMLElement | null

					if (target) {
						target.parentNode?.insertBefore(caretElement, target)
					}
				} else {
					target = containerRef.current?.querySelector(
						`[data-word="${wordIdx}"][data-char="${caretIdx}"]`
					) as HTMLElement | null

					if (target) {
						target.appendChild(caretElement)
					}
				}
			})
		})
	}, []) // Consider adding [players, socket] if players can change on mount

	const otherPlayers = socket ? players.filter(p => p.id !== socket.id) : []

	return (
		<div>
			<p>Current id: {currentWordIdx}</p>
			<p>Current word: {currentWord}</p>
			<p>Current word length: {currentWord?.length}</p>
			<p>Original word: {words[currentWordIdx]}</p>
			<p>Original word length: {words[currentWordIdx].length}</p>
			<p>Typed: {typed}</p>
			<p>Typed length: {typed?.length}</p>
			<p>
				Caret index: {caretIdx} Word index: {currentWordIdx}
			</p>
			<p>Players: {players.length}/4</p>

			{/*<div className='mb-4'>*/}
			{/*	{otherPlayers.map((player, index) => {*/}
			{/*		const caret = player.progress?.caret*/}
			{/*		return (*/}
			{/*			<div key={player.id} className='text-sm'>*/}
			{/*				<span style={{ color: getPlayerColor(index) }}>*/}
			{/*					{player.playerName}*/}
			{/*				</span>*/}
			{/*				: Word {caret?.wordIdx ?? 0}, Position {caret?.caretIdx ?? -1}*/}
			{/*			</div>*/}
			{/*		)*/}
			{/*	})}*/}
			{/*</div>*/}

			{/*{mode === 'practice' && (*/}
			{/*	<div>*/}
			{/*		Duration:{' '}*/}
			{/*		{GAME_DURATION &&*/}
			{/*			GAME_DURATION.map((duration, idx) => {*/}
			{/*				return (*/}
			{/*					<span*/}
			{/*						onClick={() => {*/}
			{/*							setSelectedDuration(duration)*/}
			{/*							setRemainingTime(duration)*/}
			{/*						}}*/}
			{/*						key={idx}*/}
			{/*						className={`${duration === selectedDuration ? 'font-bold text-yellow-400' : ''} mr-2 cursor-pointer`}*/}
			{/*					>*/}
			{/*						{duration === 0 ? 'No time' : duration}*/}
			{/*					</span>*/}
			{/*				)*/}
			{/*			})}*/}
			{/*	</div>*/}
			{/*)}*/}
			{duration !== 0 ? (
				<div className='mb-[10px] text-4xl font-bold text-accent-primary'>
					{remainingTime}
				</div>
			) : (
				<div className='mb-[10px] text-4xl font-bold text-accent-primary'>
					{timeElapsed}
				</div>
			)}
			<div
				ref={containerRef}
				tabIndex={0}
				className='max-h-[400px] text-gray-500 w-[1200px] flex flex-wrap gap-4 relative'
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
				{localWords?.map((word, wordIdx) => (
					<span className='text-3xl' key={wordIdx}>
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

											//if (caretIdx === newLength) {
											setCaretIdx(prev => Math.max(-1, prev - 1))
											setTyped(prev => prev.slice(0, -1))

											// delete extended characters if typed length is greater than the original word length

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

											return
										} else {
											return
										}
									}
									if (!startTime) {
										setStartTime(Date.now())
									}
									if (
										typed.length >= words[currentWordIdx].length &&
										mode === TypingMode.PRACTICE
									) {
										const newWord = localWords[currentWordIdx] + e.key
										setLocalWords(prev => {
											const newLocalWords = [...prev]
											newLocalWords[currentWordIdx] = newWord
											return newLocalWords
										})
										setCurrentWord(newWord)
									}
									if (mode === TypingMode.MULTIPLAYER) {
										const nextChar = localWords[currentWordIdx]?.[caretIdx + 1]
										if (nextChar && nextChar === e.key) {
											//allow to next char only on typed correctly
											setCaretIdx(prev => prev + 1)
										} else {
											e.preventDefault()
										}
									} else {
										setCaretIdx(prev => prev + 1)
										setTyped(prev => prev + e.key)
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
			{mode === TypingMode.PRACTICE && (
				<Modal
					open={!!results}
					onCancel={handleReset}
					footer={[
						<Button key='close' onClick={handleReset}>
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
			)}
			{mode === TypingMode.MULTIPLAYER && (
				<Modal
					open={results != null && position != null}
					onCancel={handleReset}
					footer={[
						<Button key='close' onClick={handleReset}>
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
					{position !== null && <p>Position: {position + 1}</p>}
				</Modal>
			)}
			{mode === TypingMode.PRACTICE && (
				<TbReload
					className='size-8 cursor-pointer mt-[50px] mx-auto text-gray-400'
					onClick={() => handleReset()}
				/>
			)}
		</div>
	)
}

export default MainGameContainer
