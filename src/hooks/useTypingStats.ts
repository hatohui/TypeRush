import { useCallback } from 'react'
import { CharacterState } from '../common/types.ts'

const useTypingStats = (
	wordResults: Record<number, string[]>,
	timeElapsed: number
) => {
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
		const wpm = timeInMinutes > 0 ? correct / 5 / timeInMinutes : 0
		const rawWpm = timeInMinutes > 0 ? totalTyped / 5 / timeInMinutes : 0

		return { accuracy, wpm, rawWpm, correct, incorrect }
	}, [wordResults, timeElapsed])

	return { calculateStats }
}

export default useTypingStats
