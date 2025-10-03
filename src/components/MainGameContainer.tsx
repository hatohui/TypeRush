import { Button } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'
import Caret from './Caret.tsx'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
gsap.registerPlugin(Flip)

const MainGameContainer = ({ words }: { words: string[] }) => {
	const [currentWordIdx, setCurrentWordIdx] = useState(0)
	const [currentWord, setCurrentWord] = useState<string | null>(
		words[currentWordIdx]
	)
	const [typed, setTyped] = useState<string>('')
	const [wordResults, setWordResults] = useState<Record<number, string[]>>({})
	const containerRef = useRef<HTMLDivElement>(null)
	const [caretIdx, setCaretIdx] = useState(-1)

	const { updateCaret, roomId, players, socket } = useGameStore()

	const caretRefs = useRef<(HTMLSpanElement | null)[]>([])

	useEffect(() => {
		caretRefs.current = Array.from({ length: 4 }, () => null)
	}, [])

	const handleSpacePress = () => {
		if (typed.trim() === '') return
		setCaretIdx(-1)
		const currentResults = words[currentWordIdx].split('').map((char, idx) => {
			if (idx < typed.length) {
				return typed[idx] === char ? 'correct' : 'incorrect'
			}
			return 'untyped'
		})

		setWordResults(prev => ({
			...prev,
			[currentWordIdx]: currentResults,
		}))

		setCurrentWordIdx(prev => {
			const nextIdx = prev + 1
			setCurrentWord(words[nextIdx] ?? null)
			return nextIdx
		})
		setTyped('')
	}

	const handleReset = () => {
		setCurrentWordIdx(0)
		setTyped('')
		setCurrentWord(words[0])
		setWordResults([])
		setCaretIdx(-1)
		if (roomId) {
			updateCaret({ caretIdx: -1, wordIdx: 0 }, roomId)
		}
	}

	useEffect(() => {
		if (!roomId) return
		if (caretIdx !== -1 || currentWordIdx !== 0) {
			updateCaret({ caretIdx, wordIdx: currentWordIdx }, roomId)
		}
	}, [caretIdx, currentWordIdx, roomId, updateCaret])

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

	const getPlayerColor = (playerIndex: number) => {
		const colors = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b']
		return colors[playerIndex] || '#6b7280'
	}

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
			<div
				ref={containerRef}
				tabIndex={0}
				className='h-[400px] text-gray-500 w-[900px] border border-black p-10 flex flex-wrap relative'
			>
				{words.map((word, wordIdx) => (
					<span
						className={`mr-2 text-3xl ${currentWord === word ? 'text-black' : ''}`}
						key={wordIdx}
					>
						{word === currentWord && (
							<input
								className='text-3xl text-transparent caret-white absolute flex focus:outline-none focus:ring-0 focus:border-transparent'
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
									if (words[currentWordIdx][caretIdx + 1] === e.key) {
										setCaretIdx(prev => prev + 1)
									}
								}}
								onChange={e => {
									const value = e.target.value.replace(/ /g, '')
									setTyped(value)
								}}
							/>
						)}
						{word.split('').map((char, idx) => {
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
		</div>
	)
}

export default MainGameContainer
