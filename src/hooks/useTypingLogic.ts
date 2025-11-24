import React, { useCallback, useState } from 'react'
import { BlockedKeysSet, CharacterState, InputKey } from '../common/types.ts'
import { MAX_OVERFLOW } from '../common/constant.ts'

// Utility function to build final word result for stats calculation (multiplayer mode)
export const buildFinalWordResult = (word: string, typed: string): string[] => {
	return word.split('').map((char, idx) => {
		return typed[idx] === char ? 'correct' : 'incorrect'
	})
}

// Utility function to build word result with character-by-character evaluation
// Handles untyped characters and overflow
export const buildWordResult = (word: string, typed: string): string[] => {
	const currentResults = word.split('').map((char, idx) => {
		if (idx < typed.length) {
			return typed[idx] === char
				? CharacterState.CORRECT
				: CharacterState.INCORRECT
		}
		return CharacterState.UNTYPED
	})

	// Handle overflow characters
	if (typed.length > word.length) {
		const overflowCount = typed.length - word.length
		for (let i = 0; i < overflowCount; i++) {
			currentResults.push(CharacterState.INCORRECT)
		}
	}

	return currentResults
}

const useTypingLogic = (words: string[]) => {
	const [localWords, setLocalWords] = useState<string[]>(words)
	const [currentWordIdx, setCurrentWordIdx] = useState(0)
	const [currentWord, setCurrentWord] = useState<string | null>(
		localWords[currentWordIdx]
	)
	const [typed, setTyped] = useState<string>('')
	const [caretIdx, setCaretIdx] = useState(-1)
	const [wordResults, setWordResults] = useState<Record<number, string[]>>({})

	const handleSpacePress = (isFinish: boolean) => {
		if (typed.trim() === '') return

		const currentResults = buildWordResult(words[currentWordIdx], typed)

		setWordResults(prev => ({
			...prev,
			[currentWordIdx]: currentResults,
		}))

		if (!isFinish) {
			setCaretIdx(-1)
			setCurrentWordIdx(prev => {
				const nextIdx = prev + 1
				setCurrentWord(localWords[nextIdx] ?? null)
				return nextIdx
			})
			setTyped('')
		}
	}

	const resetTypingState = useCallback(() => {
		setCurrentWordIdx(0)
		setTyped('')
		setCurrentWord(words[0] ?? null)
		setWordResults({})
		setCaretIdx(-1)
		setLocalWords(words)
	}, [words])

	const getCharStyle = (wordIdx: number, idx: number, char: string) => {
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
		return state
	}

	const isBlockedKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		return BlockedKeysSet.has(e.key)
	}

	const onKeyDownPracticeMode = (
		e: React.KeyboardEvent<HTMLInputElement>,
		startTime: number | null,
		setStartTime: (value: React.SetStateAction<number | null>) => void
	) => {
		{
			if (isBlockedKey(e)) {
				e.preventDefault()
				return
			}

			if (
				typed.length >= words[currentWordIdx].length + MAX_OVERFLOW &&
				e.key !== InputKey.BACKSPACE
			)
				return

			if (e.key === InputKey.SPACE) {
				e.preventDefault()
				handleSpacePress(false)
				return
			}

			if (e.key === InputKey.BACKSPACE) {
				if (typed.length > 0) {
					const newLength = typed.length - 1
					setCaretIdx(prev => Math.max(-1, prev - 1))
					setTyped(prev => prev.slice(0, -1))

					if (newLength >= words[currentWordIdx].length) {
						const newWord = localWords[currentWordIdx].slice(0, newLength)
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

			if (!startTime) setStartTime(Date.now())
		}
	}

	const onKeyDownMultiplayer = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (isBlockedKey(e)) {
			e.preventDefault()
			return
		}

		if (e.key === InputKey.SPACE) {
			if (caretIdx + 1 >= words[currentWordIdx].length) {
				handleSpacePress(false)
			}
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
	}

	return {
		currentWordIdx,
		currentWord,
		typed,
		caretIdx,
		wordResults,
		localWords,
		setLocalWords,
		handleSpacePress,
		resetTypingState,
		setCurrentWord,
		setCaretIdx,
		setWordResults,
		setTyped,
		setCurrentWordIdx,
		onKeyDownPracticeMode,
		getCharStyle,
		onKeyDownMultiplayer,
		isBlockedKey,
	}
}

export default useTypingLogic
