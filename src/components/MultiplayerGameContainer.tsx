import { Button } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'
import Caret from './Caret.tsx'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import {
	InputKey,
	CharacterState,
	PlayerColor,
	type SingleplayerResultType,
} from '../common/types.ts'
import { MAX_OVERFLOW } from '../common/constant.ts'
import GameFinishModalSingle from './GameFinishModalSingle.tsx'
import CountdownProgress from './CountdownProgress.tsx'

gsap.registerPlugin(Flip)

interface MultiplayerGameContainerProps {
	words: string[]
}

const MultiplayerGameContainer = ({ words }: MultiplayerGameContainerProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const caretRefs = useRef<(HTMLSpanElement | null)[]>([])
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const {
		updateCaret,
		roomId,
		players,
		socket,
		handlePlayerFinish,
		position,
		gameReset,
		config,
		isGameStarted,
	} = useGameStore()

	const [localWords, setLocalWords] = useState<string[]>(words)
	const [currentWordIdx, setCurrentWordIdx] = useState(0)
	const [currentWord, setCurrentWord] = useState<string | null>(localWords[currentWordIdx])
	const [typed, setTyped] = useState<string>('')
	const [caretIdx, setCaretIdx] = useState(-1)
	const [wordResults, setWordResults] = useState<Record<number, string[]>>({})
	const [results, setResults] = useState<null | SingleplayerResultType>(null)
	const [timeElapsed, setTimeElapsed] = useState<number>(0)

	const duration = config?.mode === 'wave-rush' ? config.duration : 0

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
		if (typed.length !== words[currentWordIdx].length) return

		setCaretIdx(-1)

		const currentResults = words[currentWordIdx].split('').map((char, idx) => {
			if (idx < typed.length) {
				return typed[idx] === char ? CharacterState.CORRECT : CharacterState.INCORRECT
			}
			return CharacterState.UNTYPED
		})

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
		setTimeElapsed(0)
		setResults(null)
		gameReset()
	}, [words, roomId, updateCaret, gameReset])

	// Initialize caret refs
	useEffect(() => {
		caretRefs.current = Array.from({ length: 4 }, () => null)
	}, [])

	// Timer effect for wave-rush mode - starts when game starts
	useEffect(() => {
		if (config?.mode !== 'wave-rush') return
		if (!isGameStarted) return

		timerRef.current = setInterval(() => {
			setTimeElapsed(prev => {
				const newValue = prev + 0.1
				return newValue
			})
		}, 100)

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [isGameStarted, config?.mode])

	// Check if time is up (wave-rush mode)
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
			handlePlayerFinish(roomId, stats)
		}
	}, [currentWordIdx, caretIdx, words, calculateStats, handlePlayerFinish, roomId])

	// Update caret position to server
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
	}, [])

	const otherPlayers = socket ? players.filter(p => p.id !== socket.id) : []

	return (
		<div>
			{config?.mode === 'wave-rush' && (
				<CountdownProgress duration={duration} timeElapsed={timeElapsed} />
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
				{localWords?.map((word, wordIdx) => (
					<span key={wordIdx}>
						{word === currentWord && (
							<input
								className='text-3xl opacity-0 absolute flex focus:outline-none focus:ring-0 focus:border-transparent'
								autoFocus
								type='text'
								value={typed}
								onKeyDown={e => {

									if (e.key === InputKey.SPACE) {
										handleSpacePress()
										e.preventDefault()
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
											setCaretIdx(prev => Math.max(-1, prev - 1))
											setTyped(prev => prev.slice(0, -1))
										}
										return
									}

									const nextChar = words[currentWordIdx]?.[caretIdx + 1]
									if (nextChar && nextChar === e.key) {
										setCaretIdx(prev => prev + 1)
										setTyped(prev => prev + e.key)
									} else {
										e.preventDefault()
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
								<span key={idx} className={state} data-word={wordIdx} data-char={idx}>
									{char}
								</span>
							)
						})}
					</span>
				))}
			</div>

			{results && (
				<GameFinishModalSingle
					open={position != null}
					onCancel={handleReset}
					footer={[
						<Button key='close' onClick={handleReset}>
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
