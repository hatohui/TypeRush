import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore } from '../stores/useGameStore.ts'

const useGameTimer = (isMultiplayer: boolean) => {
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const [startTime, setStartTime] = useState<number | null>(null)
	const [timeElapsed, setTimeElapsed] = useState<number>(0)
	const { isGameStarted } = useGameStore()

	useEffect(() => {
		// For practice: wait for startTime to be set (when user types)
		// For multiplayer: wait for isGameStarted
		const shouldStart = isMultiplayer ? isGameStarted : startTime !== null

		if (!shouldStart) return

		timerRef.current = setInterval(() => {
			setTimeElapsed(prev => Number((prev + 0.1).toFixed(1)))
		}, 100)

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [isGameStarted, isMultiplayer, startTime])

	const stopTimer = () => {
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
	}

	const startTimer = useCallback(() => {
		if (timerRef.current) return
		timerRef.current = setInterval(() => {
			setTimeElapsed(prev => Number((prev + 0.1).toFixed(1)))
		}, 100)
	}, [])

	const resetTimer = useCallback(() => {
		stopTimer()
		setTimeElapsed(0)
		setStartTime(null)
	}, [])

	return {
		timeElapsed,
		startTime,
		setStartTime,
		resetTimer,
		stopTimer,
		timerRef,
		startTimer,
	}
}

export default useGameTimer
