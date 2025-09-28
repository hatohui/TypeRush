import { Button } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'
import Caret from './caret.tsx'
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

	const { updateOpponentCaret, roomId, opponentCaretIdx, opponentWordIdx } =
		useGameStore()

	const caretRef = useRef<HTMLSpanElement>(null)

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
		if (roomId) updateOpponentCaret(-1, 0, roomId)
	}

	useEffect(() => {
		if (!roomId) return
		if (caretIdx !== -1 || currentWordIdx !== 0) {
			updateOpponentCaret(caretIdx, currentWordIdx, roomId)
		}
	}, [caretIdx, currentWordIdx, roomId, updateOpponentCaret])

	useEffect(() => {
		if (!caretRef.current) return

		let target: HTMLElement | null = null

		if (opponentCaretIdx === -1) {
			target = containerRef.current?.querySelector(
				`[data-word="${opponentWordIdx}"][data-char="0"]`
			) as HTMLElement | null

			if (target) {
				const state = Flip.getState(caretRef.current)
				target.parentNode?.insertBefore(caretRef.current, target)
				Flip.from(state, {
					duration: 0.4,
					ease: 'power1.inOut',
				})
			}
			return
		}

		target = containerRef.current?.querySelector(
			`[data-word="${opponentWordIdx}"][data-char="${opponentCaretIdx}"]`
		) as HTMLElement | null

		if (!target) return

		const state = Flip.getState(caretRef.current)
		target.appendChild(caretRef.current)
		Flip.from(state, {
			duration: 0.4,
			ease: 'power1.inOut',
		})
	}, [opponentCaretIdx, opponentWordIdx])

	return (
		<div>
			<p>Current id: {currentWordIdx}</p>
			<p>Current word: {currentWord}</p>
			<p>Typed: {typed}</p>
			<p>Typed length: {typed?.length}</p>
			<p>
				Caret index: {caretIdx} Word index: {currentWordIdx}
			</p>
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

				<Caret ref={caretRef} isOpponent playerName='hi' />
			</div>
		</div>
	)
}

export default MainGameContainer
